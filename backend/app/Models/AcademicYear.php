<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AcademicYear extends Model
{
    protected $fillable = [
        'tenant_id',
        'name',
        'start_date',
        'end_date',
        'is_active',
        'is_schedule_locked'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
        'is_schedule_locked' => 'boolean'
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
