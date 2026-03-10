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

    protected $casts = [
        'is_active' => 'boolean',
        'requires_transparent_photo' => 'boolean',
        'canvas_state' => 'array',
        'price' => 'integer',
    ];
}
