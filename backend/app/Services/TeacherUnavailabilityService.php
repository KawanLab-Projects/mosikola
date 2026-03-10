<?php

namespace App\Services;

use App\Repositories\TeacherUnavailabilityRepository;
use Illuminate\Support\Collection;

class TeacherUnavailabilityService
{
    public function __construct(private TeacherUnavailabilityRepository $repo) {}

    public function getByTeacherAndYear(int $teacherId, int $academicYearId): Collection
    {
        return $this->repo->getByTeacherAndYear($teacherId, $academicYearId);
    }

    public function replace(int $tenantId, int $teacherId, int $academicYearId, array $slots): void
    {
        $this->repo->replaceForTeacherAndYear($tenantId, $teacherId, $academicYearId, $slots);
    }
}
