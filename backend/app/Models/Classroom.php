<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Classroom extends Model
{
    protected $fillable = [
        'public_id',
        'name',
        'study_program_id',
        'tenant_id',
        'short',
        'grade_level',
    ];

    protected $hidden = [
        'id',
        'study_program_id',
    ];

    public function studyProgram()
    {
        return $this->belongsTo(StudyProgram::class);
    }

    public function students()
    {
        return $this->hasMany(Student::class);
    }

    /**
     * The wali_kelas assignment for the currently active academic year.
     * Eager load with ->with('homeroomAssignment.teacher').
     */
    public function homeroomAssignment()
    {
        return $this->hasOne(TeacherAssignment::class)
            ->where('assignment_type', 'wali_kelas')
            ->whereHas('academicYear', fn ($q) => $q->where('is_active', true));
    }
}
