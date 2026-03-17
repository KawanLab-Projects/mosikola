<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PositiveBehavior extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'point_value',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
