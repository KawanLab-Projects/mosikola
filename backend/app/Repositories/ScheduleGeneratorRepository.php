<?php

namespace App\Repositories;

use App\Models\Schedule;
use Illuminate\Support\Collection;

class ScheduleGeneratorRepository
{
    public function deleteByYear(int $tenantId, int $academicYearId): void
    {
        Schedule::where('tenant_id', $tenantId)
            ->where('academic_year_id', $academicYearId)
            ->delete();
    }

    public function bulkInsert(array $rows): void
    {
        $dbKeys = [
            'tenant_id',
            'academic_year_id',
            'classroom_id',
            'subject_id',
            'teacher_id',
            'day_of_week',
            'period_start',
            'period_end',
            'start_time',
            'end_time',
            'created_at',
            'updated_at',
        ];

        $filtered = array_map(fn ($row) => array_intersect_key($row, array_flip($dbKeys)), $rows);

        foreach (array_chunk($filtered, 200) as $chunk) {
            Schedule::insert($chunk);
        }
    }

    public function getByYear(int $tenantId, int $academicYearId): Collection
    {
        return Schedule::where('tenant_id', $tenantId)
            ->where('academic_year_id', $academicYearId)
            ->with(['classroom', 'subject', 'teacher'])
            ->get();
    }
}
