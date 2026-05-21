<?php

namespace App\Services;

use App\Models\Media;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Illuminate\Support\Facades\File;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

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

        $media = Media::create([
            'type' => $data['type'],
            'file_path' => $path ? '/uploads/' . $path : null,
            'thumbnail_path' => $thumbnailDbPath,
            'uploader_name' => $data['uploader_name'],
            'message' => $data['message'] ?? null,
            'uploader_uuid' => $data['uploader_uuid'],
            'guest_side' => $data['guest_side'],
        ]);

        // 最新のメディアIDをキャッシュに保存（通知用）
        Cache::put('latest_media_id', $media->id);

        // ベストカメラマンの集計をキャッシュに保存（マテリアライズド・キャッシュ）
        // ※画像・動画の投稿があった場合のみ再集計する
        if (in_array($data['type'], ['image', 'video'])) {
            $bestCameraman = Media::select(
                'uploader_uuid',
                'uploader_name',
                DB::raw("SUM(CASE WHEN type='image' THEN 1 ELSE 0 END) as image_count"),
                DB::raw("SUM(CASE WHEN type='video' THEN 1 ELSE 0 END) as video_count"),
                DB::raw("COUNT(*) as total_count")
            )
            ->whereIn('type', ['image', 'video'])
            ->groupBy('uploader_uuid', 'uploader_name')
            ->orderByDesc('total_count')
            ->first(); // 1位だけ取得

            if ($bestCameraman) {
                // 同率1位を取得する場合は get() して filter するなど高度な処理になるが、
                // 今回は最も投稿数が多い1人（または複数いる場合は最初の1人）をベストとする
                $topCount = $bestCameraman->total_count;
                $allTopCameramen = Media::select(
                    'uploader_uuid',
                    'uploader_name',
                    DB::raw("COUNT(*) as total_count")
                )
                ->whereIn('type', ['image', 'video'])
                ->groupBy('uploader_uuid', 'uploader_name')
                ->having('total_count', '=', $topCount)
                ->get();

                Cache::put('best_cameraman', $allTopCameramen->toArray());
            }
        }

        return $media;
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
