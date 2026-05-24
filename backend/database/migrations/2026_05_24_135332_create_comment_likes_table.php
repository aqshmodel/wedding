<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comment_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('comment_id')->constrained('comments')->onDelete('cascade');
            $table->uuid('guest_uuid')->index();
            $table->timestamps();
            
            $table->unique(['comment_id', 'guest_uuid']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comment_likes');
    }
};
