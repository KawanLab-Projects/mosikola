<?php

namespace App\Services;

use App\Models\LessonJournal;
use App\Models\Teacher;
use App\Repositories\LessonJournalRepository;
use Illuminate\Support\Collection;

class LessonJournalService
{
    public function __construct(private LessonJournalRepository $repo) {}

    // ── Teacher identity ──────────────────────────────────────────────────

    public function resolveTeacher(int $userId): ?Teacher
    {
        return $this->repo->findTeacherByUserId($userId);
    }

    // ── Schedules ─────────────────────────────────────────────────────────

    public function getTeacherSchedules(int $teacherId, ?int $academicYearId): Collection
    {
        return $this->repo->getSchedulesForTeacher($teacherId, $academicYearId);
    }

    // ── Journal CRUD ──────────────────────────────────────────────────────

    public function getJournalByScheduleAndDate(int $scheduleId, string $date): ?LessonJournal
    {
        return $this->repo->findByScheduleAndDate($scheduleId, $date);
    }

    /**
     * Create a new journal entry.
     * Verifies that the given scheduleId belongs to the teacher.
     *
     * @throws \Symfony\Component\HttpKernel\Exception\HttpException
     */
    public function createJournal(int $teacherId, array $data): LessonJournal
    {
        $schedule = $this->repo->findScheduleById($data['schedule_id']);
        abort_if(! $schedule, 404, 'Jadwal tidak ditemukan.');
        abort_if($schedule->teacher_id !== $teacherId, 403, 'Jadwal ini bukan milik Anda.');

        return $this->repo->createJournal([
            ...$data,
            'tenant_id' => $schedule->tenant_id,
            'status' => 'filled',
            'filled_at' => now(),
        ]);
    }

    /**
     * Update an existing journal entry.
     *
     * @throws \Symfony\Component\HttpKernel\Exception\HttpException
     */
    public function updateJournal(int $teacherId, int $journalId, array $data): LessonJournal
    {
        $journal = $this->repo->findJournalById($journalId);
        abort_if(! $journal, 404, 'Jurnal tidak ditemukan.');

        $schedule = $journal->schedule;
        abort_if($schedule->teacher_id !== $teacherId, 403, 'Jurnal ini bukan milik Anda.');

        return $this->repo->updateJournal($journal, $data);
    }

    // ── Attendance ────────────────────────────────────────────────────────

    public function getAttendances(int $journalId): Collection
    {
        $journal = $this->repo->findJournalById($journalId);
        abort_if(! $journal, 404, 'Jurnal tidak ditemukan.');

        return $this->repo->getStudentsWithAttendance($journal);
    }

    /**
     * Bulk upsert attendance records.
     *
     * @throws \Symfony\Component\HttpKernel\Exception\HttpException
     */
    public function saveAttendances(int $teacherId, int $journalId, array $rows): void
    {
        $journal = $this->repo->findJournalById($journalId);
        abort_if(! $journal, 404, 'Jurnal tidak ditemukan.');
        abort_if($journal->schedule->teacher_id !== $teacherId, 403, 'Jurnal ini bukan milik Anda.');

        $this->repo->upsertAttendance($journalId, $rows);
    }
}
