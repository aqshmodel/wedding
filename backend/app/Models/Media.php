<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Media extends Model
{
    protected $fillable = [
        'batch_id',
        'type',
        'file_path',
        'thumbnail_path',
        'uploader_name',
        'message',
        'uploader_uuid',
        'guest_side',
        'likes_count',
    ];

    public function likes()
    {
        return $this->hasMany(Like::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class, 'batch_id', 'batch_id')->whereNull('parent_id');
    }
}
