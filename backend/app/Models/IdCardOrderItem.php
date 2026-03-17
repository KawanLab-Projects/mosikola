<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IdCardOrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'student_id',
        'photo_path',
        'print_snapshot',
    ];

    protected $appends = ['photo_url'];

    protected $casts = [
        'print_snapshot' => 'array',
    ];

    public function order()
    {
        return $this->belongsTo(IdCardOrder::class, 'order_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function getPhotoUrlAttribute()
    {
        if (empty($this->photo_path)) {
            return null;
        }

        // If it was uploaded before R2 migration, it starts with 'storage/'
        if (str_starts_with($this->photo_path, 'storage/')) {
            return asset($this->photo_path);
        }

        // Newer uploads are direct S3 paths
        return \Illuminate\Support\Facades\Storage::disk('s3')->url($this->photo_path);
    }
}
