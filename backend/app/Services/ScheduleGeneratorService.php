<?php

namespace App\Services;

use App\Repositories\CurriculumItemRepository;
use App\Repositories\SchoolPeriodRepository;
use App\Repositories\TeacherUnavailabilityRepository;
use Illuminate\Support\Collection;

class ScheduleGeneratorService
{
    public function __construct(
        private SchoolPeriodRepository $periodRepo,
        private CurriculumItemRepository $curriculumRepo,
        private TeacherUnavailabilityRepository $unavailRepo,
    ) {}

    /**
     * Generate a schedule and return preview + unresolved items.
     * Does NOT write to the database.
     *
     * @return array{ assigned: array<int, array<string, mixed>>, unresolved: array<int, array<string, mixed>> }
     */
    public function generate(int $tenantId, int $academicYearId): array
    {
        set_time_limit(300);

        $periods       = $this->periodRepo->getByTenant($tenantId)->sortBy('period_number');
        $items         = $this->curriculumRepo->getForGenerator($tenantId, $academicYearId);
        $unavailGroups = $this->unavailRepo->getByYearGrouped($tenantId, $academicYearId);

        $activePeriods = $periods->where('is_break', false)->pluck('period_number')->values()->toArray();

        if (empty($activePeriods)) {
            return ['assigned' => [], 'unresolved' => []];
        }

        // Build slot occupation maps: [teacher_id|classroom_id][day][period] = true
        /** @var array<int, array<int, array<int, bool>>> */
        $teacherSlots = [];
        /** @var array<int, array<int, array<int, bool>>> */
        $classroomSlots = [];

        // Expand curriculum items into individual session tasks, sort most-constrained first
        $tasks = $this->expandAndSort($items, $unavailGroups, $activePeriods);

        $assigned   = [];
        $unresolved = [];
        $now        = now()->toDateTimeString();

        foreach ($tasks as $task) {
            $placed = false;

            foreach (range(1, 5) as $day) {
                foreach ($activePeriods as $periodNum) {
                    if (!$this->isSlotValid($task, $day, $periodNum, $teacherSlots, $classroomSlots, $unavailGroups)) {
                        continue;
                    }

                    $periodData = $periods->firstWhere('period_number', $periodNum);

                    $assigned[] = [
                        'tenant_id'        => $tenantId,
                        'academic_year_id' => $academicYearId,
                        'classroom_id'     => $task['classroom_id'],
                        'subject_id'       => $task['subject_id'],
                        'teacher_id'       => $task['teacher_id'],
                        'classroom'        => $task['classroom_name'],
                        'subject'          => $task['subject_name'],
                        'teacher'          => $task['teacher_name'],
                        'day_of_week'      => $day,
                        'period_start'     => $periodNum,
                        'period_end'       => $periodNum,
                        'start_time'       => $periodData->start_time,
                        'end_time'         => $periodData->end_time,
                        'created_at'       => $now,
                        'updated_at'       => $now,
                    ];

                    $teacherSlots[$task['teacher_id']][$day][$periodNum]     = true;
                    $classroomSlots[$task['classroom_id']][$day][$periodNum] = true;
                    $placed = true;
                    break 2;
                }
            }

            if (!$placed) {
                $unresolved[] = [
                    'classroom' => $task['classroom_name'],
                    'subject'   => $task['subject_name'],
                    'teacher'   => $task['teacher_name'],
                ];
            }
        }

        return ['assigned' => $assigned, 'unresolved' => $unresolved];
    }

    /**
     * Expand items to individual session tasks and sort most-constrained (fewest available slots) first.
     *
     * @param Collection $items
     * @param Collection $unavailGroups
     * @param int[] $activePeriods
     * @return array<int, array<string, mixed>>
     */
    private function expandAndSort(Collection $items, Collection $unavailGroups, array $activePeriods): array
    {
        $tasks = [];
        $totalSlots = 5 * count($activePeriods);

        foreach ($items as $item) {
            $teacherUnavailCount = ($unavailGroups[$item->teacher_id] ?? collect())->count();
            $availableSlots      = $totalSlots - $teacherUnavailCount;

            for ($i = 0; $i < $item->hours_per_week; $i++) {
                $tasks[] = [
                    'classroom_id'   => $item->classroom_id,
                    'subject_id'     => $item->subject_id,
                    'teacher_id'     => $item->teacher_id,
                    'classroom_name' => $item->classroom->name ?? '',
                    'subject_name'   => $item->subject->name ?? '',
                    'teacher_name'   => $item->teacher->name ?? '',
                    'available_slots' => $availableSlots,
                ];
            }
        }

        usort($tasks, fn($a, $b) => $a['available_slots'] <=> $b['available_slots']);

        return $tasks;
    }

    /**
     * Check all hard constraints for a given slot.
     *
     * @param array<string, mixed> $task
     * @param array<int, array<int, array<int, bool>>> $teacherSlots
     * @param array<int, array<int, array<int, bool>>> $classroomSlots
     * @param Collection $unavailGroups
     */
    private function isSlotValid(
        array $task,
        int $day,
        int $period,
        array &$teacherSlots,
        array &$classroomSlots,
        Collection $unavailGroups
    ): bool {
        // Teacher clash
        if (isset($teacherSlots[$task['teacher_id']][$day][$period])) {
            return false;
        }
        // Classroom clash
        if (isset($classroomSlots[$task['classroom_id']][$day][$period])) {
            return false;
        }
        // Teacher unavailability
        $teacherUnavail = $unavailGroups[$task['teacher_id']] ?? collect();
        return !$teacherUnavail
            ->where('day_of_week', $day)
            ->where('period_number', $period)
            ->isNotEmpty();
    }
}
