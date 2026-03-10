<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    protected $hidden = ['id'];
    protected $fillable = [
        'name',
        'code',
        'tenant_id',
    ];
}
