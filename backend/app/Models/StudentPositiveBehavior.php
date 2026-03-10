<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentPositiveBehavior extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'student_id',
        'positive_behavior_id',
        'date',
        'notes',
        'recorded_by_user_id',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function positiveBehavior()
    {
        return $this->belongsTo(PositiveBehavior::class);
    }

    public function recordedBy()
    {
        return $this->belongsTo(User::class, 'recorded_by_user_id');
    }
}
