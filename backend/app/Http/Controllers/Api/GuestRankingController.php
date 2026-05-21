<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;

class GuestRankingController extends Controller
{
    /**
     * キャッシュされたベストカメラマン情報を取得して返す (O(1)レスポンス)
     */
    public function top()
    {
        // キャッシュが存在しない場合は空配列を返す
        $bestCameramen = Cache::get('best_cameraman', []);

        return response()->json([
            'best_cameraman' => $bestCameramen
        ]);
    }
}
