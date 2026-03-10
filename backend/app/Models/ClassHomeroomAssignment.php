<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassHomeroomAssignment extends Model
{
    protected $fillable = [
        'classroom_id',
        'teacher_id',
    ];
}
