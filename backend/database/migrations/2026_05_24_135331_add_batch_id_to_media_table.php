<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->uuid('batch_id')->nullable()->after('id')->index();
        });

        // 既存データのマイグレーション (uploader_uuid と 分単位のcreated_at でまとめる)
        $records = DB::table('media')->orderBy('created_at')->get();
        $batches = [];

        foreach ($records as $record) {
            // created_atを分単位で切り捨ててグループキーにする
            $minute = substr($record->created_at, 0, 16);
            $key = $record->uploader_uuid . '_' . $minute;
            
            if (!isset($batches[$key])) {
                $batches[$key] = (string) Str::uuid();
            }
            
            DB::table('media')->where('id', $record->id)->update([
                'batch_id' => $batches[$key]
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->dropColumn('batch_id');
        });
    }
};
