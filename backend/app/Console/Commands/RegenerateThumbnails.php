<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Media;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Illuminate\Support\Facades\File;

class RegenerateThumbnails extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:regenerate-thumbnails';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Regenerate thumbnails for all image media';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting thumbnail regeneration...');

        $mediaList = Media::where('type', 'image')->get();
        $manager = new ImageManager(new Driver());
        $thumbnailsDir = public_path('uploads/thumbnails');

        if (!File::exists($thumbnailsDir)) {
            File::makeDirectory($thumbnailsDir, 0755, true);
        }

        $count = 0;
        foreach ($mediaList as $media) {
            // file_path は /uploads/media/... などの想定
            if (!$media->file_path) {
                continue;
            }

            // 先頭の / を削除して public_path と結合
            $relativePath = ltrim($media->file_path, '/');
            $fullPath = public_path($relativePath);

            if (!File::exists($fullPath)) {
                $this->warn("File not found: {$fullPath}");
                continue;
            }

            try {
                $image = $manager->decode($fullPath);
                
                // 幅1080pxにスケールダウン（比率維持）
                $image->scaleDown(width: 1080);
                
                $thumbnailFilename = 'thumb_' . basename($fullPath);
                $thumbnailFullPath = $thumbnailsDir . '/' . $thumbnailFilename;
                
                // 画質90で保存
                $image->save($thumbnailFullPath, 90);
                
                $media->thumbnail_path = '/uploads/thumbnails/' . $thumbnailFilename;
                $media->save();

                $this->info("Regenerated thumbnail for ID: {$media->id}");
                $count++;
            } catch (\Exception $e) {
                $this->error("Failed to process ID {$media->id}: " . $e->getMessage());
            }
        }

        $this->info("Completed! Regenerated {$count} thumbnails.");
    }
}
