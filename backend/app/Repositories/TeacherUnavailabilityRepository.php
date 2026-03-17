<?php

namespace App\Repositories;

use App\Models\TeacherUnavailability;
use Illuminate\Support\Collection;

class TeacherUnavailabilityRepository
{
    public function getByTeacherAndYear(int $teacherId, int $academicYearId): Collection
    {
        return TeacherUnavailability::where('teacher_id', $teacherId)
            ->where('academic_year_id', $academicYearId)
            ->get();
    }

    public function getByYearGrouped(int $tenantId, int $academicYearId): Collection
    {
        return TeacherUnavailability::where('tenant_id', $tenantId)
            ->where('academic_year_id', $academicYearId)
            ->get()
            ->groupBy('teacher_id');
    }

    public function replaceForTeacherAndYear(int $tenantId, int $teacherId, int $academicYearId, array $slots): void
    {
        TeacherUnavailability::where('teacher_id', $teacherId)
            ->where('academic_year_id', $academicYearId)
            ->delete();

        if (! empty($slots)) {
            $rows = array_map(fn ($slot) => [
                'tenant_id' => $tenantId,
                'teacher_id' => $teacherId,
                'academic_year_id' => $academicYearId,
                'day_of_week' => $slot['day_of_week'],
                'period_number' => $slot['period_number'],
                'created_at' => now(),
                'updated_at' => now(),
            ], $slots);
            TeacherUnavailability::insert($rows);
        }
    }
}
