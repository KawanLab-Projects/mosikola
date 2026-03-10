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
}
