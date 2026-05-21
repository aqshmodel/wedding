<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class UpdateCheckController extends Controller
{
    /**
     * DBにアクセスせず、キャッシュから最新のメディアIDを取得してEtagとともに返す
     */
    public function check(Request $request)
    {
        $latestId = Cache::get('latest_media_id', 0);
        
        // Etagを生成 (例: "id-1234")
        $etag = '"id-' . $latestId . '"';

        // クライアントが送ってきた If-None-Match ヘッダと比較
        if ($request->header('If-None-Match') === $etag) {
            // 変更がなければ 304 Not Modified を返し、レスポンスボディを空にする
            return response('', 304);
        }

        // 変更がある場合は最新IDと新しいEtagを返す
        return response()->json([
            'latest_media_id' => $latestId
        ])->setEtag($etag);
    }
}
