<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use App\Models\Media;

class GuestRankingController extends Controller
{
    /**
     * キャッシュされたベストカメラマン情報を取得して返す (O(1)レスポンス)
     */
    public function top()
    {
        // キャッシュが存在しない場合は空配列を返す...としていたが、
        // 設定をONにしたタイミングなどでキャッシュがない場合があるためフォールバック処理を追加
        $bestCameramen = Cache::get('best_cameraman');

        if (empty($bestCameramen)) {
            $bestCameraman = Media::select(
                'uploader_uuid',
                'uploader_name',
                DB::raw("COUNT(*) as total_count")
            )
            ->whereIn('type', ['image', 'video'])
            ->whereNotIn('uploader_name', ['塚田崇博', '塚田友里'])
            ->groupBy('uploader_uuid', 'uploader_name')
            ->orderByDesc('total_count')
            ->first();

            if ($bestCameraman) {
                $topCount = $bestCameraman->total_count;
                $allTopCameramen = Media::select(
                    'uploader_uuid',
                    'uploader_name',
                    DB::raw("COUNT(*) as total_count")
                )
                ->whereIn('type', ['image', 'video'])
                ->whereNotIn('uploader_name', ['塚田崇博', '塚田友里'])
                ->groupBy('uploader_uuid', 'uploader_name')
                ->having('total_count', '=', $topCount)
                ->get();

                $bestCameramen = $allTopCameramen->toArray();
                Cache::put('best_cameraman', $bestCameramen);
            } else {
                $bestCameramen = [];
            }
        }

        return response()->json([
            'best_cameraman' => $bestCameramen
        ]);
    }
}
