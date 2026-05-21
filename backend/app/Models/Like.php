<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Like extends Model
{
    protected $fillable = [
        'media_id',
        'guest_uuid',
    ];

    public function media()
    {
        return $this->belongsTo(Media::class);
    }
}
