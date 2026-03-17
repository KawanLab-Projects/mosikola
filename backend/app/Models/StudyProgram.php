<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudyProgram extends Model
{
    protected $hidden = ['id'];

    protected $fillable = [
        'name',
        'short',
        'tenant_id',
    ];
}
