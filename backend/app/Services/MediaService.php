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
            if ($data['type'] === 'image') {
                try {
                    $manager = new ImageManager(new Driver());
                    $image = $manager->decode($file->getRealPath());
                    
                    $mediaDir = public_path('uploads/media');
                    if (!File::exists($mediaDir)) {
                        File::makeDirectory($mediaDir, 0755, true);
                    }
                    
                    // EXIF等のプロファイルを削除し、新しいJPEGとして保存
                    $filename = uniqid() . '_' . time() . '.jpg';
                    $fullPath = $mediaDir . '/' . $filename;
                    $image->save($fullPath, 90);
                    $path = 'media/' . $filename;
                    
                    // オリジナルファイルを渡すとEXIFが残っている可能性があるため、保存後のパスのファイルを元にサムネイルを生成するのが本来は安全ですが、
                    // generateThumbnail内でも再度デコードしているためEXIFは消えます。
                    $thumbnailDbPath = $this->generateThumbnail($file, $path);
                } catch (\Exception $e) {
                    \Log::error('Image processing failed: ' . $e->getMessage());
                    // フォールバック
                    $path = $file->store('media', 'uploads');
                    $thumbnailDbPath = $this->generateThumbnail($file, $path);
                }
            } else {
                $path = $file->store('media', 'uploads');
                if ($data['type'] === 'video' && $thumbnailFile) {
                    $thumbnailDbPath = $this->generateThumbnail($thumbnailFile, $path);
                }
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
            ->whereNotIn('uploader_name', ['塚田崇博', '塚田友里'])
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
                ->whereNotIn('uploader_name', ['塚田崇博', '塚田友里'])
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

    /**
     * メディアの削除（物理ファイル＋データベース）
     */
    public function deleteMedia(Media $media): void
    {
        try {
            // 物理ファイルの削除
            if ($media->file_path) {
                // "/uploads/media/xxx" -> "uploads/media/xxx" にして public_path() を解決
                $relativePath = ltrim($media->file_path, '/');
                $fullPath = public_path($relativePath);
                if (File::exists($fullPath)) {
                    File::delete($fullPath);
                }
            }

            if ($media->thumbnail_path) {
                $relativePath = ltrim($media->thumbnail_path, '/');
                $fullPath = public_path($relativePath);
                if (File::exists($fullPath)) {
                    File::delete($fullPath);
                }
            }

            // ZIPアーカイブ破棄を促すため、最新メディアIDを意図的に更新する
            // 削除によって構成が変わるため、既存のキャッシュZIPを作り直させる必要がある
            Cache::put('latest_media_id', time());

            // データベースから削除 (likes等のリレーションは必要ならカスケード削除される想定。もしくは手動削除)
            // likesテーブルとのリレーションがあるため、まずは関連するlikesを削除
            $media->likes()->delete();
            $media->delete();

        } catch (\Exception $e) {
            \Log::error('Media deletion failed: ' . $e->getMessage());
            throw $e;
        }
    }
}
