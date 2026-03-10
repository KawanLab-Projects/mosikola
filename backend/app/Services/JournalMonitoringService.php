<?php

namespace App\Services;

use App\Models\LessonJournal;
use App\Models\Schedule;
use App\Models\Teacher;
use Illuminate\Support\Collection;

class JournalMonitoringService
{
    /**
     * Fetch all teachers in a tenant along with their schedules and journals
     * within the given week (start_date to end_date).
     */
    public function getWeeklyMonitoring(int $tenantId, string $startDate, string $endDate, ?int $academicYearId): Collection
    {
        // 1. Get all teachers in the tenant
        $teachers = Teacher::where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get(['id', 'public_id', 'name', 'nip']);

        if ($teachers->isEmpty()) {
            return collect();
        }

        $teacherIds = $teachers->pluck('id')->toArray();

        // 2. Get schedules for these teachers (optionally filtered by academic year)
        $schedulesQuery = Schedule::with(['subject', 'classroom'])
            ->whereIn('teacher_id', $teacherIds)
            ->where('tenant_id', $tenantId);

        if ($academicYearId) {
            $schedulesQuery->where('academic_year_id', $academicYearId);
        }

        $schedules = $schedulesQuery->get()->groupBy('teacher_id');

        // 3. Get all lesson journals for these schedules within the date range
        $scheduleIds = $schedulesQuery->pluck('id')->toArray();
        $journals = collect();

        if (!empty($scheduleIds)) {
            $journals = LessonJournal::with('attendances')
                ->whereIn('schedule_id', $scheduleIds)
                ->whereBetween('date', [$startDate, $endDate])
                ->get()
                ->groupBy(function ($journal) {
                    // Group by schedule_id AND date
                    return $journal->schedule_id . '_' . $journal->date->format('Y-m-d');
                });
        }

        // 4. Map the data structure for the frontend
        return $teachers->map(function ($teacher) use ($schedules, $journals) {
            $teacherSchedules = $schedules->get($teacher->id, collect());

            $mappedSchedules = $teacherSchedules->map(function ($schedule) use ($journals) {
                // Let the frontend compute the exact date based on the week start and day_of_week,
                // but we attach all journals that belong to this specific schedule within the week.
                // Normally a schedule happens once a week, so there should be at most 1 journal
                // for this schedule in the given date range.

                // Find the journal by looking at all journals, filtering by schedule_id
                $scheduleJournals = $journals->flatten()->filter(function ($j) use ($schedule) {
                    return $j->schedule_id === $schedule->id;
                })->first();

                return [
                    'id'           => $schedule->id,
                    'day_of_week'  => $schedule->day_of_week,
                    'period_start' => $schedule->period_start,
                    'period_end'   => $schedule->period_end,
                    'start_time'   => $schedule->start_time,
                    'end_time'     => $schedule->end_time,
                    'subject'      => $schedule->subject ? [
                        'name' => $schedule->subject->name,
                        'code' => $schedule->subject->code
                    ] : null,
                    'classroom'    => $schedule->classroom ? [
                        'name'  => $schedule->classroom->name,
                        'short' => $schedule->classroom->short
                    ] : null,
                    'journal'      => $scheduleJournals ? [
                        'id'          => $scheduleJournals->id,
                        'date'        => $scheduleJournals->date->format('Y-m-d'),
                        'status'      => $scheduleJournals->status,
                        'filled_at'   => $scheduleJournals->filled_at ? $scheduleJournals->filled_at->toIso8601String() : null,
                        'topic'       => $scheduleJournals->topic,
                        'notes'       => $scheduleJournals->notes,
                        'homework'    => $scheduleJournals->homework,
                        'attendance'  => [
                            'hadir' => $scheduleJournals->attendances->where('status', 'hadir')->count(),
                            'sakit' => $scheduleJournals->attendances->where('status', 'sakit')->count(),
                            'izin'  => $scheduleJournals->attendances->where('status', 'izin')->count(),
                            'alpha' => $scheduleJournals->attendances->where('status', 'alpha')->count(),
                        ]
                    ] : null,
                ];
            });

            return [
                'teacher_id' => $teacher->id,
                'public_id'  => $teacher->public_id,
                'name'       => $teacher->name,
                'nip'        => $teacher->nip,
                'schedules'  => $mappedSchedules,
            ];
        });
    }
}
