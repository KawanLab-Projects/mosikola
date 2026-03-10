<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TenantRegistration extends Model
{
    protected $fillable = [
        'school_name',
        'slug',
        'school_type',
        'email',
        'phone',
        'contact_person',
        'plan_id',
        'status',
        'rejection_reason'
    ];

    protected $casts = [
        'status' => 'string',
    ];

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }
}
