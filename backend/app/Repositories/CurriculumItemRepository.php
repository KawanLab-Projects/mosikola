<?php

namespace App\Repositories;

use App\Models\CurriculumItem;
use Illuminate\Support\Collection;

class CurriculumItemRepository
{
    public function getByYear(int $tenantId, int $academicYearId): Collection
    {
        return CurriculumItem::where('tenant_id', $tenantId)
            ->where('academic_year_id', $academicYearId)
            ->with(['classroom', 'subject', 'teacher'])
            ->orderBy('classroom_id')
            ->get();
    }

    public function getByYearAndClassroom(int $tenantId, int $academicYearId, int $classroomId): Collection
    {
        return CurriculumItem::where('tenant_id', $tenantId)
            ->where('academic_year_id', $academicYearId)
            ->where('classroom_id', $classroomId)
            ->with(['subject', 'teacher'])
            ->get();
    }

    public function create(array $data): CurriculumItem
    {
        return CurriculumItem::create($data);
    }

    public function update(int $id, array $data): bool
    {
        return CurriculumItem::where('id', $id)->update($data) > 0;
    }

    public function delete(int $id): bool
    {
        return CurriculumItem::where('id', $id)->delete() > 0;
    }

    public function getForGenerator(int $tenantId, int $academicYearId): Collection
    {
        return CurriculumItem::where('tenant_id', $tenantId)
            ->where('academic_year_id', $academicYearId)
            ->with(['classroom', 'subject', 'teacher'])
            ->get();
    }
}
