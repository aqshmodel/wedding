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
        
        // 保存先のパス (publicディスク)
        $directory = 'archives';
        $fullPath = Storage::disk('public')->path("{$directory}/{$fileName}");
        
        // 2. すでに同じIDのZIPが存在する場合は、それを返す（キャッシュヒット）
        if (Storage::disk('public')->exists("{$directory}/{$fileName}")) {
            return Storage::disk('public')->url("{$directory}/{$fileName}");
        }

        // --- ここから下はZIPが存在しない場合（新規作成） ---

        // ディレクトリが存在しなければ作成
        if (!Storage::disk('public')->exists($directory)) {
            Storage::disk('public')->makeDirectory($directory);
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
            if (Storage::disk('public')->exists("{$directory}/{$fileName}")) {
                return Storage::disk('public')->url("{$directory}/{$fileName}");
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
            $tempFullPath = Storage::disk('public')->path("{$directory}/{$tempFileName}");

            $zip = new ZipArchive();
            if ($zip->open($tempFullPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
                throw new Exception("ZIPファイルの作成に失敗しました。");
            }

            // 5. ファイルをZIPに追加
            $addedCount = 0;
            foreach ($mediaList as $media) {
                if (empty($media->file_path)) continue;

                // DB上の "/storage/media/xxx.jpg" を "media/xxx.jpg" に変換
                $relativePath = preg_replace('#^/?storage/#', '', $media->file_path);

                if ($relativePath && Storage::disk('public')->exists($relativePath)) {
                    $sourcePath = Storage::disk('public')->path($relativePath);
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

            return Storage::disk('public')->url("{$directory}/{$fileName}");

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
            $files = Storage::disk('public')->files($directory);
            foreach ($files as $file) {
                $basename = basename($file);
                // 最新のZIPファイルでなく、かつZIP拡張子であれば削除
                if ($basename !== $currentFileName && str_ends_with($basename, '.zip')) {
                    Storage::disk('public')->delete($file);
                }
            }
        } catch (Exception $e) {
            // クリーンアップの失敗は全体を止めない
            Log::warning("古いZIPアーカイブのクリーンアップに失敗しました: " . $e->getMessage());
        }
    }
}
