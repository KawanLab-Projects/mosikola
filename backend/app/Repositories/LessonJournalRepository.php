<?php

namespace App\Repositories;

use App\Models\LessonAttendance;
use App\Models\LessonJournal;
use App\Models\Schedule;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Support\Collection;

interface LessonJournalRepoInterface
{
    public function getSchedulesForTeacher(int $teacherId, ?int $academicYearId): Collection;
    public function findByScheduleAndDate(int $scheduleId, string $date): ?LessonJournal;
    public function createJournal(array $data): LessonJournal;
    public function updateJournal(LessonJournal $journal, array $data): LessonJournal;
    public function findJournalById(int $id): ?LessonJournal;
    public function getStudentsWithAttendance(LessonJournal $journal): Collection;
    public function upsertAttendance(int $journalId, array $rows): void;
    public function findTeacherByUserId(int $userId): ?Teacher;
    public function findScheduleById(int $id): ?Schedule;
}

class LessonJournalRepository implements LessonJournalRepoInterface
{
    public function getSchedulesForTeacher(int $teacherId, ?int $academicYearId): Collection
    {
        return Schedule::with(['classroom', 'subject'])
            ->where('teacher_id', $teacherId)
            ->when($academicYearId, fn($q) => $q->where('academic_year_id', $academicYearId))
            ->orderBy('day_of_week')
            ->orderBy('period_start')
            ->get();
    }

    public function findByScheduleAndDate(int $scheduleId, string $date): ?LessonJournal
    {
        return LessonJournal::with('attendances.student')
            ->where('schedule_id', $scheduleId)
            ->whereDate('date', $date)
            ->first();
    }

    public function createJournal(array $data): LessonJournal
    {
        return LessonJournal::create($data);
    }

    public function updateJournal(LessonJournal $journal, array $data): LessonJournal
    {
        $journal->update($data);
        return $journal->fresh();
    }

    public function findJournalById(int $id): ?LessonJournal
    {
        return LessonJournal::with('schedule')->find($id);
    }

    public function getStudentsWithAttendance(LessonJournal $journal): Collection
    {
        $students = Student::where('classroom_id', $journal->schedule->classroom_id)
            ->active()
            ->orderBy('name')
            ->get(['id', 'public_id', 'name', 'nisn']);

        $existing = LessonAttendance::where('lesson_journal_id', $journal->id)
            ->get()
            ->keyBy('student_id');

        return $students->map(function ($student) use ($existing) {
            $att = $existing->get($student->id);
            return [
                'student_id'    => $student->id,
                'public_id'     => $student->public_id,
                'name'          => $student->name,
                'nisn'          => $student->nisn,
                'status'        => $att?->status ?? 'hadir',
                'notes'         => $att?->notes ?? null,
                'attendance_id' => $att?->id ?? null,
            ];
        });
    }

    public function upsertAttendance(int $journalId, array $rows): void
    {
        foreach ($rows as $row) {
            LessonAttendance::updateOrCreate(
                ['lesson_journal_id' => $journalId, 'student_id' => $row['student_id']],
                ['status' => $row['status'], 'notes' => $row['notes'] ?? null]
            );
        }
    }

    public function findTeacherByUserId(int $userId): ?Teacher
    {
        return Teacher::where('user_id', $userId)->first();
    }

    public function findScheduleById(int $id): ?Schedule
    {
        return Schedule::find($id);
    }
}
