<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    protected $fillable = [
        'public_id',
        'name',
        'user_id',
        'classroom_id',
        'tenant_id',
        'nisn',
        'nfc_uid',
        'birth_place',
        'birth_date',
        'address',
        'parent_phone',
        'parent_name',
        'status',
    ];

    protected $hidden = [
        'id',
        'user_id',
        'classroom_id',
        'created_at',
        'updated_at',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function classroom()
    {
        return $this->belongsTo(Classroom::class);
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function gradeLogs()
    {
        return $this->hasMany(StudentGradeLog::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeArchived($query)
    {
        return $query->where('status', 'archived');
    }

    public function studentViolations()
    {
        return $this->hasMany(StudentViolation::class);
    }

    public function studentPositiveBehaviors()
    {
        return $this->hasMany(StudentPositiveBehavior::class);
    }

    public function getTotalPointsAttribute()
    {
        $tenantId = $this->tenant_id;
        if (! $tenantId) {
            return 0;
        }

        // Fetch settings using the correct helper method
        $validity = \App\Models\TenantSetting::getValue($tenantId, 'discipline', 'points_validity', 'academic_year');

        $pointsQuery = $this->studentViolations()->join('violations', 'student_violations.violation_id', '=', 'violations.id');
        $posQuery = $this->studentPositiveBehaviors()->join('positive_behaviors', 'student_positive_behaviors.positive_behavior_id', '=', 'positive_behaviors.id');

        if ($validity === 'academic_year' || $validity === 'reduction') {
            // Note: simple current year filter, assuming July-June academic year roughly, or just current year
            // For true academic year, it should look up current active academic year from a table.
            // Using a simple approximation or standard DB query for now:
            $pointsQuery->whereYear('student_violations.date', date('Y'));
            $posQuery->whereYear('student_positive_behaviors.date', date('Y'));
        }

        $violationPoints = (int) $pointsQuery->sum('violations.points');

        if ($validity === 'reduction') {
            $positivePoints = (int) $posQuery->sum('positive_behaviors.point_value');
            $total = $violationPoints - $positivePoints;

            return $total > 0 ? $total : 0; // Points shouldn't be negative generally, but can be bounded
        }

        return $violationPoints;
    }

    public function guruWaliAssignments()
    {
        return $this->hasMany(GuruWaliStudent::class);
    }

    public function developmentNotes()
    {
        return $this->hasMany(StudentDevelopmentNote::class);
    }
}
