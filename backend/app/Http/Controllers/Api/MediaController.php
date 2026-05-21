<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Media;
use App\Http\Requests\StoreMediaRequest;
use App\Services\MediaService;
use App\Services\ChunkUploadService;
use Illuminate\Support\Facades\Log;

class MediaController extends Controller
{
    private MediaService $mediaService;
    private ChunkUploadService $chunkService;

    public function __construct(MediaService $mediaService, ChunkUploadService $chunkService)
    {
        $this->mediaService = $mediaService;
        $this->chunkService = $chunkService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $type = $request->query('type'); // 'image', 'video', 'message'
        
        $query = Media::query();
        
        if ($type === 'image') {
            $query->where('type', 'image');
        } elseif ($type === 'video') {
            $query->where('type', 'video');
        } elseif ($type === 'message') {
            $query->whereNotNull('message')->where('message', '!=', '');
        }

        $guestUuid = $request->query('guest_uuid');
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
            // ページネーションとレスポンス形式を合わせるため data でラップする
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
    public function destroy(string $id)
    {
        //
    }
}
