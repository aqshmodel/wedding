<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class ChunkUploadService
{
    /**
     * チャンクファイルを保存する
     */
    public function saveChunk(string $sessionId, int $chunkIndex, UploadedFile $file): void
    {
        $chunkDir = storage_path('app/chunks/' . $sessionId);
        
        if (!File::exists($chunkDir)) {
            File::makeDirectory($chunkDir, 0755, true);
        }

        // chunk_0, chunk_1 のように保存
        $file->move($chunkDir, 'chunk_' . $chunkIndex);
    }

    /**
     * すべてのチャンクを結合し、疑似的な UploadedFile を返す
     */
    public function mergeChunks(string $sessionId, int $totalChunks, string $originalName, string $mimeType): UploadedFile
    {
        $chunkDir = storage_path('app/chunks/' . $sessionId);
        $tempDir = storage_path('app/tmp');

        if (!File::exists($tempDir)) {
            File::makeDirectory($tempDir, 0755, true);
        }

        // 拡張子を復元
        $extension = pathinfo($originalName, PATHINFO_EXTENSION);
        $finalFilename = $sessionId . ($extension ? '.' . $extension : '.mp4');
        $finalPath = $tempDir . '/' . $finalFilename;

        // 結合先のファイルを空で作成（既に存在すれば上書き）
        File::put($finalPath, '');

        // 0番から順にチャンクの中身を結合
        for ($i = 0; $i < $totalChunks; $i++) {
            $chunkPath = $chunkDir . '/chunk_' . $i;
            if (File::exists($chunkPath)) {
                $chunkData = File::get($chunkPath);
                File::append($finalPath, $chunkData);
            } else {
                throw new \Exception("Missing chunk: " . $i);
            }
        }

        // 結合完了後、チャンクディレクトリを削除（クリーンアップ）
        File::deleteDirectory($chunkDir);

        // UploadedFile インスタンスを生成して返す
        return new UploadedFile(
            $finalPath,
            $originalName,
            $mimeType,
            null,
            true // test mode = true (moveの制約をバイパスするため)
        );
    }
}
