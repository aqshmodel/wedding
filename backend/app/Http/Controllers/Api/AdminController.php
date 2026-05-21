<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Media;

class AdminController extends Controller
{
    public function ranking(Request $request)
    {
        // 投稿数ランキング (写真と動画の合計で降順)
        $postsRanking = Media::select(
            'uploader_uuid',
            'uploader_name',
            DB::raw("SUM(CASE WHEN type='image' THEN 1 ELSE 0 END) as image_count"),
            DB::raw("SUM(CASE WHEN type='video' THEN 1 ELSE 0 END) as video_count"),
            DB::raw("COUNT(*) as total_count")
        )
        ->whereIn('type', ['image', 'video'])
        ->groupBy('uploader_uuid', 'uploader_name')
        ->orderByDesc('total_count')
        ->get();

        // いいね数ランキング (もらったいいね合計で降順)
        $likesRanking = Media::select(
            'uploader_uuid',
            'uploader_name',
            DB::raw("SUM(likes_count) as total_likes")
        )
        ->groupBy('uploader_uuid', 'uploader_name')
        ->orderByDesc('total_likes')
        ->get();

        // いいね数0の人は除外するかどうか（現状は0でも表示）
        $likesRanking = $likesRanking->filter(function($item) {
            return $item->total_likes > 0;
        })->values();

        return response()->json([
            'posts' => $postsRanking,
            'likes' => $likesRanking
        ]);
    }
}
