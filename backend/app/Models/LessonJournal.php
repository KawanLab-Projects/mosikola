<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LessonJournal extends Model
{
    protected $fillable = [
        'tenant_id',
        'schedule_id',
        'date',
        'room',
        'topic',
        'notes',
        'homework',
        'status',
        'filled_at',
        'photos',
    ];

    protected $casts = [
        'date' => 'date',
        'filled_at' => 'datetime',
        'photos' => 'array',
    ];

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(Schedule::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(LessonAttendance::class);
    }
}
