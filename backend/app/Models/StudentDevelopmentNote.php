<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentDevelopmentNote extends Model
{
    protected $fillable = [
        'tenant_id',
        'academic_year_id',
        'teacher_id',
        'student_id',
        'note',
        'date',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
