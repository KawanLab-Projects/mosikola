<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = [
        'name',
        'code',
        'student_limit',
        'teacher_limit',
        'price',
        'early_bird_price',
        'early_bird_limit',
        'attendance_enabled',
        'parent_monitoring_enabled',
        'notification_enabled',
        'features',
        'is_active'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'early_bird_price' => 'decimal:2',
        'features' => 'array',
        'attendance_enabled' => 'boolean',
        'parent_monitoring_enabled' => 'boolean',
        'notification_enabled' => 'boolean',
        'is_active' => 'boolean'
    ];

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }
}
