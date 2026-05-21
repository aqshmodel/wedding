<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Media;
use App\Http\Requests\StoreMediaRequest;
use App\Services\MediaService;

class MediaController extends Controller
{
    private MediaService $mediaService;

    public function __construct(MediaService $mediaService)
    {
        $this->mediaService = $mediaService;
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
        
        if ($isAll) {
            $media = $query->latest()->get();
            // ページネーションとレスポンス形式を合わせるため data でラップする
            return response()->json([
                'data' => $media,
                'total_likes' => $totalLikes
            ]);
        } else {
            $media = $query->latest()->paginate(20);
            $responseArray = $media->toArray();
            $responseArray['total_likes'] = $totalLikes;
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
            $request->file('file')
        );

        return response()->json([
            'success' => true,
            'data' => $media
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
