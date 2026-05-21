<?php

namespace App\Services;

use App\Models\Media;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use ZipArchive;
use Exception;

class ZipArchiveService
{
    /**
     * ZIPファイルを生成し、ダウンロード用のURLを返す
     *
     * @return string
     */
    public function generateZipUrl(): string
    {
        // 1. 最新の投稿IDを取得（キャッシュベース）
        $latestId = Cache::get('latest_media_id', 0);
        $fileName = "wedding_photos_{$latestId}.zip";
        
        // 保存先のパス (public/uploads/archives)
        $directory = public_path('uploads/archives');
        $fullPath = $directory . '/' . $fileName;
        
        // 2. すでに同じIDのZIPが存在する場合は、それを返す（キャッシュヒット）
        if (file_exists($fullPath)) {
            return asset("uploads/archives/{$fileName}");
        }

        // --- ここから下はZIPが存在しない場合（新規作成） ---

        // ディレクトリが存在しなければ作成
        if (!file_exists($directory)) {
            mkdir($directory, 0755, true);
        }

        // アトミックな生成のための排他ロック (300秒)
        // 同じIDのZIPを複数プロセスで同時に作らないように制御
        $lock = Cache::lock("zip_generating_{$latestId}", 300);

        if (!$lock->get()) {
            // 他のプロセスが作成中の場合、完了を待つのはフロントエンドのUX上良くないため、
            // 簡易的にエラー（HTTP例外）を返すか、今回はタイムアウトを待つ簡易実装にする。
            // ※ロリポップ環境ではロックの恩恵が薄い場合もあるため、確実な一時ファイル＋リネーム手法をメインとする。
            try {
                // 最大15秒ブロックして待機
                $lock->block(15);
            } catch (\Illuminate\Contracts\Cache\LockTimeoutException $e) {
                throw new Exception("現在ZIPファイルを生成中です。数秒後にもう一度お試しください。");
            }
        }

        try {
            // もし待機中に別のプロセスが作り終えていたらそれを返す
            if (file_exists($fullPath)) {
                return asset("uploads/archives/{$fileName}");
            }

            // 3. 対象となる画像ファイル一覧を取得
            // 動画は容量が大きすぎるため除外 (type = image のみ)
            $mediaList = Media::where('type', 'image')->get();

            if ($mediaList->isEmpty()) {
                throw new Exception("ダウンロード可能な画像がありません。");
            }

            // タイムアウトを無効化（大量の画像圧縮に時間がかかるため）
            set_time_limit(0);

            // 4. 一時ファイルとしてZIPを作成
            $tempFileName = "temp_{$latestId}_" . uniqid() . ".zip";
            $tempFullPath = $directory . '/' . $tempFileName;

            $zip = new ZipArchive();
            if ($zip->open($tempFullPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
                throw new Exception("ZIPファイルの作成に失敗しました。");
            }

            // 5. ファイルをZIPに追加
            $addedCount = 0;
            foreach ($mediaList as $media) {
                if (empty($media->file_path)) continue;

                // ファイル名のみ抽出し、public/uploads/media/ 直下のパスを作る
                $basename = basename($media->file_path);
                $sourcePath = public_path("uploads/media/{$basename}");

                if (file_exists($sourcePath)) {
                    // ZIP内でのファイル名 (例: 塚田崇博_1.jpg)
                    $ext = pathinfo($sourcePath, PATHINFO_EXTENSION);
                    if (empty($ext)) $ext = 'jpg';
                    $zipEntryName = "{$media->uploader_name}_{$media->id}.{$ext}";
                    
                    if ($zip->addFile($sourcePath, $zipEntryName)) {
                        $addedCount++;
                    }
                }
            }

            // ZIPを閉じる（ここで実際にファイルが書き込まれる）
            $zip->close();

            if ($addedCount === 0) {
                // PHPのZipArchiveは中身が空だとファイルを出力しないため、ここでエラーにする
                throw new Exception("ZIPに追加できる有効な画像ファイルが見つかりませんでした。");
            }

            // 6. アトミックなリネーム (競合を防ぐ)
            if (!file_exists($tempFullPath)) {
                throw new Exception("ZIP一時ファイルの生成に失敗しました。");
            }
            // renameはOSレベルでアトミックなので、書き込み途中の壊れたファイルがユーザーに渡ることはない
            rename($tempFullPath, $fullPath);

            // 7. 古いZIPファイルのクリーンアップ処理 (最新のファイル以外を削除)
            $this->cleanupOldArchives($directory, $fileName);

            return asset("uploads/archives/{$fileName}");

        } finally {
            // ロックを解放
            $lock->release();
        }
    }

    /**
     * 最新のアーカイブ以外の古いZIPを削除する
     */
    private function cleanupOldArchives(string $directory, string $currentFileName)
    {
        try {
            $files = scandir($directory);
            foreach ($files as $basename) {
                if ($basename === '.' || $basename === '..') continue;
                
                // 最新のZIPファイルでなく、かつZIP拡張子であれば削除
                if ($basename !== $currentFileName && str_ends_with($basename, '.zip')) {
                    $filePath = $directory . '/' . $basename;
                    if (is_file($filePath)) {
                        unlink($filePath);
                    }
                }
            }
        } catch (Exception $e) {
            // クリーンアップの失敗は全体を止めない
            Log::warning("古いZIPアーカイブのクリーンアップに失敗しました: " . $e->getMessage());
        }
    }
}
