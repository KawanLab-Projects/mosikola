<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceToken extends Model
{
    protected $fillable = [
        'tenant_id',
        'token',
        'qr_secret',
        'generated_at',
        'expires_at',
    ];

    protected $hidden = ['id', 'created_at', 'updated_at'];
}
