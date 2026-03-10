<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchoolPeriod extends Model
{
    protected $fillable = [
        'tenant_id',
        'period_number',
        'start_time',
        'end_time',
        'is_break',
        'label',
    ];

    protected $casts = [
        'is_break' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
