<?php

namespace App\Services;

use App\Models\Media;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Illuminate\Support\Facades\File;
use Illuminate\Http\UploadedFile;

class MediaService
{
    /**
     * メディアの保存とサムネイル生成を行う
     */
    public function storeMedia(array $data, ?UploadedFile $file, ?UploadedFile $thumbnailFile = null): Media
    {
        $path = null;
        $thumbnailDbPath = null;

        if ($file) {
            $path = $file->store('media', 'uploads');

            if ($data['type'] === 'image') {
                $thumbnailDbPath = $this->generateThumbnail($file, $path);
            } elseif ($data['type'] === 'video' && $thumbnailFile) {
                // フロントエンドから送られてきたサムネイル画像を保存する
                $thumbnailDbPath = $this->generateThumbnail($thumbnailFile, $path);
            }
        }

        return Media::create([
            'type' => $data['type'],
            'file_path' => $path ? '/uploads/' . $path : null,
            'thumbnail_path' => $thumbnailDbPath,
            'uploader_name' => $data['uploader_name'],
            'message' => $data['message'] ?? null,
            'uploader_uuid' => $data['uploader_uuid'],
            'guest_side' => $data['guest_side'],
        ]);
    }

    /**
     * サムネイルの生成
     */
    private function generateThumbnail(UploadedFile $file, string $storedPath): ?string
    {
        try {
            $manager = new ImageManager(new Driver());
            $image = $manager->decode($file->getRealPath());
            
            // 幅1080pxにスケールダウン（比率維持・高画質化）
            $image->scaleDown(width: 1080);
            
            // サムネイル保存先ディレクトリの確認・作成
            $thumbnailsDir = public_path('uploads/thumbnails');
            if (!File::exists($thumbnailsDir)) {
                File::makeDirectory($thumbnailsDir, 0755, true);
            }

            // 元のファイル名から拡張子を除いたベース名を取得し、.jpgを付与
            $baseName = pathinfo($storedPath, PATHINFO_FILENAME);
            $thumbnailFilename = 'thumb_' . $baseName . '.jpg';
            $thumbnailFullPath = $thumbnailsDir . '/' . $thumbnailFilename;
            
            // 保存 (画質90)
            $image->save($thumbnailFullPath, 90);
            
            return '/uploads/thumbnails/' . $thumbnailFilename;
        } catch (\Exception $e) {
            \Log::error('Thumbnail generation failed: ' . $e->getMessage());
            return null;
        }
    }
}
