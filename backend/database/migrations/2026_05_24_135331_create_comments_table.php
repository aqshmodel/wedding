<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            // 親となる投稿バッチのID
            $table->uuid('batch_id')->index();
            // 返信先のコメントID（ネスト用）
            $table->foreignId('parent_id')->nullable()->constrained('comments')->onDelete('cascade');
            
            $table->uuid('guest_uuid')->index();
            $table->string('guest_name');
            $table->enum('guest_side', ['groom', 'bride']);
            $table->text('message');
            $table->integer('likes_count')->default(0);
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};
