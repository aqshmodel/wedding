<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. file_path を nullable に変更
        Schema::table('media', function (Blueprint $table) {
            $table->string('file_path')->nullable()->change();
        });

        // 2. type の enum に 'message' を追加（MySQL のみ）
        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE media MODIFY COLUMN type ENUM('image', 'video', 'message') NOT NULL");
        }
        // SQLite は enum を持たないため、バリデーションはアプリケーション側で行う
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE media MODIFY COLUMN type ENUM('image', 'video') NOT NULL");
        }

        Schema::table('media', function (Blueprint $table) {
            $table->string('file_path')->nullable(false)->change();
        });
    }
};
