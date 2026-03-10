<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    protected $fillable = [
        'public_id',
        'name',
        'school_type',
        'slug',
        'email',
        'phone',
        'address',
        'logo',
        'student_limit',
        'is_active',
    ];

    public function getStudentLimitAttribute()
    {
        return optional($this->activeSubscription?->plan)->student_limit;
    }

    /** All users belonging to this tenant via pivot */
    public function users()
    {
        return $this->hasManyThrough(User::class, TenantUser::class, 'tenant_id', 'id', 'id', 'user_id');
    }

    /** Admin TenantUser entries for this tenant */
    public function admins()
    {
        return $this->hasMany(TenantUser::class)->where('role', 'admin');
    }

    public function tenantUsers()
    {
        return $this->hasMany(TenantUser::class);
    }

    public function settings()
    {
        return $this->hasOne(TenantSetting::class);
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    public function academicYears()
    {
        return $this->hasMany(AcademicYear::class);
    }

    public function activeSubscription()
    {
        return $this->hasOne(Subscription::class)
            ->where('is_active', true);
    }

    public function activeAcademicYear()
    {
        return $this->hasOne(AcademicYear::class)
            ->where('is_active', true);
    }
}
