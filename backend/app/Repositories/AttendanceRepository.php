<?php

namespace App\Repositories;

use App\Models\Attendance;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Support\Collection;

interface AttendanceRepoInterface
{
    public function create(array $data): Attendance;

    public function checkAttendance(Student $student): bool;

    public function getStudentAttendanceOnDate(int $studentId, string $date): ?Attendance;

    public function getLateArrival(string $date, string $limitTime): ?Collection;

    public function getByStudentIdsAndMonth(array $studentIds, Carbon $start, Carbon $end);
}

class AttendanceRepository implements AttendanceRepoInterface
{
    public function create(array $data): Attendance
    {
        return Attendance::create($data);
    }

    public function getStudentAttendanceOnDate(int $studentId, string $date): ?Attendance
    {
        return Attendance::where('student_id', $studentId)
            ->whereDate('attendance_date', $date)
            ->where('type', 'check_in') // Assuming we want the initial check_in or just any attendance to check if it exists
            ->first();
    }

    public function checkAttendance(Student $student): bool
    {
        return Attendance::where('student_id', $student->id)
            ->whereDate('attendance_date', now()->toDateString())
            ->exists();
    }

    public function getLateArrival(string $date, string $limitTime): ?Collection
    {
        return Attendance::with([
            'student.classroom.teacher',
        ])
            ->whereDate('attendance_date', $date)
            ->whereTime('attended_at', '>', $limitTime)
            ->get();
    }

    public function getByStudentIdsAndMonth(array $studentIds, Carbon $start, Carbon $end)
    {
        return Attendance::whereIn('student_id', $studentIds)
            ->whereBetween('attendance_date', [
                $start->toDateString(),
                $end->toDateString(),
            ])
            ->orderBy('attended_at')
            ->get();
    }
}
