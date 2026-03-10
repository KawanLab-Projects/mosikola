<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentGradeLog extends Model
{
    protected $fillable = [
        'student_id',
        'academic_year_id',
        'from_classroom_id',
        'to_classroom_id',
        'action',
        'performed_by',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function fromClassroom()
    {
        return $this->belongsTo(Classroom::class, 'from_classroom_id');
    }

    public function toClassroom()
    {
        return $this->belongsTo(Classroom::class, 'to_classroom_id');
    }

    public function performedBy()
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}
