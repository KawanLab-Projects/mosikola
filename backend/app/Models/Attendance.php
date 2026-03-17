<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    protected $fillable = [
        'student_id',
        'academic_year_id',
        'attendance_date',
        'attended_at',
        'tenant_id',
        'type',
        'status',
        'method',
    ];

    protected $hidden = ['id', 'created_at', 'updated_at'];

    protected $casts = [
        'attendance_date' => 'date:Y-m-d',
        'attended_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function getTerlambatAttribute(): int
    {
        if (! $this->attended_at) {
            return 0;
        }

        $jamWajib = Carbon::parse(
            $this->attended_at->format('Y-m-d').' 07:30'
        );

        if ($this->attended_at <= $jamWajib) {
            return 0;
        }

        return $jamWajib->diffInMinutes($this->attended_at);
    }
}
