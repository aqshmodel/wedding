<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Media;
use App\Http\Requests\StoreMediaRequest;
use App\Services\MediaService;
use App\Services\ChunkUploadService;
use App\Services\ZipArchiveService;
use Illuminate\Support\Facades\Log;

class MediaController extends Controller
{
    private MediaService $mediaService;
    private ChunkUploadService $chunkService;
    private ZipArchiveService $zipService;

    public function __construct(MediaService $mediaService, ChunkUploadService $chunkService, ZipArchiveService $zipService)
    {
        $this->mediaService = $mediaService;
        $this->chunkService = $chunkService;
        $this->zipService = $zipService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $type = $request->query('type'); // 'image', 'video', 'message'
        
        $guestUuid = $request->query('guest_uuid');

        if ($type === 'message') {
            // メッセージタブ用: batch_id単位でグループ化してページネーション
            $paginator = \Illuminate\Support\Facades\DB::table('media')
                ->select('batch_id', \Illuminate\Support\Facades\DB::raw('MAX(created_at) as latest_created_at'))
                ->whereNotNull('message')
                ->where('message', '!=', '')
                ->whereNotNull('batch_id')
                ->groupBy('batch_id')
                ->orderBy('latest_created_at', 'desc')
                ->paginate(10);
            
            $batchIds = $paginator->pluck('batch_id');

            // 取得したバッチに属するすべてのMediaと、そこに紐づくコメントを取得
            $mediaList = Media::with(['comments' => function ($query) use ($guestUuid) {
                    $query->orderBy('created_at', 'asc');
                    if ($guestUuid) {
                        $query->withExists(['likes as is_liked' => function ($q) use ($guestUuid) {
                            $q->where('guest_uuid', $guestUuid);
                        }]);
                    }
                    $query->with(['replies' => function ($q) use ($guestUuid) {
                        $q->orderBy('created_at', 'asc');
                        if ($guestUuid) {
                            $q->withExists(['likes as is_liked' => function ($q2) use ($guestUuid) {
                                $q2->where('guest_uuid', $guestUuid);
                            }]);
                        }
                    }]);
                }])
                ->whereIn('batch_id', $batchIds)
                ->orderBy('created_at', 'desc')
                ->get();
            
            if ($guestUuid) {
                $mediaList->loadExists(['likes as is_liked' => function ($q) use ($guestUuid) {
                    $q->where('guest_uuid', $guestUuid);
                }]);
            }

            $totalLikes = Media::sum('likes_count');
            $totalPosts = Media::count(); // すべてのタブで全体の正確な投稿数を返す

            return response()->json([
                'current_page' => $paginator->currentPage(),
                'data' => $mediaList,
                'first_page_url' => $paginator->url(1),
                'from' => $paginator->firstItem(),
                'last_page' => $paginator->lastPage(),
                'last_page_url' => $paginator->url($paginator->lastPage()),
                'next_page_url' => $paginator->nextPageUrl(),
                'path' => $paginator->path(),
                'per_page' => $paginator->perPage(),
                'prev_page_url' => $paginator->previousPageUrl(),
                'to' => $paginator->lastItem(),
                'total' => $paginator->total(),
                'total_likes' => $totalLikes,
                'total_posts' => $totalPosts
            ]);
        }

        // image, videoの場合（既存の処理）
        $query = Media::query();
        
        if ($type === 'image') {
            $query->where('type', 'image');
        } elseif ($type === 'video') {
            $query->where('type', 'video');
        }

        if ($guestUuid) {
            $query->withExists(['likes as is_liked' => function ($q) use ($guestUuid) {
                $q->where('guest_uuid', $guestUuid);
            }]);
        }

        $isAll = $request->query('all') === 'true';
        $totalLikes = Media::sum('likes_count');
        $totalPosts = Media::count(); // 全体の正確な投稿数を取得
        
        if ($isAll) {
            $media = $query->latest()->get();
            return response()->json([
                'data' => $media,
                'total_likes' => $totalLikes,
                'total_posts' => $totalPosts
            ]);
        } else {
            $media = $query->latest()->paginate(21);
            $responseArray = $media->toArray();
            $responseArray['total_likes'] = $totalLikes;
            $responseArray['total_posts'] = $totalPosts;
            return response()->json($responseArray);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreMediaRequest $request)
    {
        $media = $this->mediaService->storeMedia(
            $request->validated(), 
            $request->file('file'),
            $request->file('thumbnail_file')
        );

        return response()->json([
            'success' => true,
            'data' => $media
        ]);
    }

    /**
     * チャンクをアップロードし、最終チャンクの場合は結合してDBに保存する
     */
    public function uploadChunk(Request $request)
    {
        $request->validate([
            'session_id' => 'required|string',
            'chunk_index' => 'required|integer',
            'total_chunks' => 'required|integer',
            'file' => 'nullable|file', // 最終チャンク以外はファイルデータのみ
            'is_final' => 'required|boolean',
        ]);

        $sessionId = $request->input('session_id');
        $chunkIndex = (int) $request->input('chunk_index');
        $totalChunks = (int) $request->input('total_chunks');
        $isFinal = filter_var($request->input('is_final'), FILTER_VALIDATE_BOOLEAN);

        // チャンクがある場合は保存（結合完了などの空リクエストもあるため分岐）
        if ($request->hasFile('file')) {
            $this->chunkService->saveChunk($sessionId, $chunkIndex, $request->file('file'));
        }

        // 最終フラグが立っている場合、結合と通常の保存処理を行う
        if ($isFinal) {
            try {
                // チャンクを結合して仮の UploadedFile にする
                $originalName = $request->input('original_name', 'video.mp4');
                $mimeType = $request->input('mime_type', 'video/mp4');
                
                $mergedFile = $this->chunkService->mergeChunks($sessionId, $totalChunks, $originalName, $mimeType);

                // 通常のStoreMediaRequestのバリデーションを通過させるための擬似データ作成
                $data = [
                    'type' => 'video',
                    'uploader_name' => $request->input('uploader_name'),
                    'message' => $request->input('message'),
                    'uploader_uuid' => $request->input('uploader_uuid'),
                    'guest_side' => $request->input('guest_side'),
                    'batch_id' => $request->input('batch_id'),
                ];

                $media = $this->mediaService->storeMedia(
                    $data, 
                    $mergedFile,
                    $request->file('thumbnail_file') // サムネイルは最終チャンクと一緒に送られる想定
                );

                return response()->json([
                    'success' => true,
                    'data' => $media,
                    'message' => 'Upload and merge complete'
                ]);

            } catch (\Exception $e) {
                Log::error('Chunk Merge Error: ' . $e->getMessage());
                return response()->json(['error' => 'Merge failed', 'message' => $e->getMessage()], 500);
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Chunk {$chunkIndex} uploaded successfully"
        ]);
    }

    /**
     * ZIPファイルをダウンロード（または生成してURLを返す）
     */
    public function downloadZip()
    {
        try {
            $zipUrl = $this->zipService->generateZipUrl();

            return response()->json([
                'success' => true,
                'url' => $zipUrl
            ]);
        } catch (\Exception $e) {
            Log::error('ZIP Download Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id)
    {
        $guestUuid = $request->input('guest_uuid');
        
        if (empty($guestUuid)) {
            return response()->json([
                'success' => false,
                'message' => 'Missing guest_uuid'
            ], 400);
        }

        $media = Media::find($id);

        if (!$media) {
            return response()->json([
                'success' => false,
                'message' => 'Media not found'
            ], 404);
        }

        // 認可: 投稿者本人であるか確認
        if ($media->uploader_uuid !== $guestUuid) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to delete this media'
            ], 403);
        }

        try {
            $this->mediaService->deleteMedia($media);
            return response()->json([
                'success' => true,
                'message' => 'Media deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete media'
            ], 500);
        }
    }
}
