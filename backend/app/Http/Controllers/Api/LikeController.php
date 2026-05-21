<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Media;
use App\Models\Like;

class LikeController extends Controller
{
    public function toggleLike(Request $request, $id)
    {
        $request->validate([
            'guest_uuid' => 'required|string'
        ]);

        $media = Media::findOrFail($id);
        
        $existingLike = Like::where('media_id', $media->id)
                            ->where('guest_uuid', $request->guest_uuid)
                            ->first();

        if ($existingLike) {
            // すでにいいねしている場合は削除（トグル）
            $existingLike->delete();
            $media->decrement('likes_count');
            $liked = false;
        } else {
            // いいねを追加
            Like::create([
                'media_id' => $media->id,
                'guest_uuid' => $request->guest_uuid
            ]);
            $media->increment('likes_count');
            $liked = true;
        }

        return response()->json([
            'success' => true,
            'liked' => $liked,
            'likes_count' => $media->likes_count
        ]);
    }
}
