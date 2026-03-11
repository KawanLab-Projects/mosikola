<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IdCardTemplate extends Model
{
    protected $fillable = [
        'name',
        'background_path',
        'price',
        'canvas_state',
        'is_active',
        'requires_transparent_photo',
    ];

    protected $appends = [
        'background_url',
        'back_background_url',
        'thumbnail_url',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'requires_transparent_photo' => 'boolean',
        'canvas_state' => 'array',
        'price' => 'integer',
    ];

    public function getBackgroundUrlAttribute()
    {
        return $this->background_path ? \Illuminate\Support\Facades\Storage::disk('s3')->url($this->background_path) : null;
    }

    public function getBackBackgroundUrlAttribute()
    {
        return $this->back_background_path ? \Illuminate\Support\Facades\Storage::disk('s3')->url($this->back_background_path) : null;
    }

    public function getThumbnailUrlAttribute()
    {
        return $this->thumbnail_path ? \Illuminate\Support\Facades\Storage::disk('s3')->url($this->thumbnail_path) : null;
    }
}
