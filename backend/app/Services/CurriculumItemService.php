<?php

namespace App\Services;

use App\Repositories\CurriculumItemRepository;
use Illuminate\Support\Collection;

class CurriculumItemService
{
    public function __construct(private CurriculumItemRepository $repo) {}

    public function getByYear(int $tenantId, int $academicYearId): Collection
    {
        return $this->repo->getByYear($tenantId, $academicYearId);
    }

    public function getByYearAndClassroom(int $tenantId, int $academicYearId, int $classroomId): Collection
    {
        return $this->repo->getByYearAndClassroom($tenantId, $academicYearId, $classroomId);
    }

    public function create(int $tenantId, int $academicYearId, array $data): array
    {
        $item = $this->repo->create([
            'tenant_id'       => $tenantId,
            'academic_year_id' => $academicYearId,
            'classroom_id'    => $data['classroom_id'],
            'subject_id'      => $data['subject_id'],
            'teacher_id'      => $data['teacher_id'],
            'hours_per_week'  => $data['hours_per_week'],
        ]);

        return $item->load(['classroom', 'subject', 'teacher'])->toArray();
    }

    public function update(int $id, array $data): bool
    {
        return $this->repo->update($id, [
            'teacher_id'     => $data['teacher_id'],
            'hours_per_week' => $data['hours_per_week'],
        ]);
    }

    public function delete(int $id): bool
    {
        return $this->repo->delete($id);
    }

    public function copyFromClassroom(int $tenantId, int $academicYearId, int $sourceClassroomId, int $targetClassroomId): int
    {
        $sourceItems = $this->getByYearAndClassroom($tenantId, $academicYearId, $sourceClassroomId);
        if ($sourceItems->isEmpty()) {
            return 0; // nothing to copy
        }

        $targetItems = $this->getByYearAndClassroom($tenantId, $academicYearId, $targetClassroomId);
        $copiedCount = 0;

        foreach ($sourceItems as $sourceItem) {
            // Check if exact same config already exists in target
            $exists = $targetItems->contains(function ($item) use ($sourceItem) {
                return $item->subject_id === $sourceItem->subject_id
                    && $item->teacher_id === $sourceItem->teacher_id;
            });

            if (!$exists) {
                // If subject exists but different teacher, we also don't insert to avoid duplicate subjects?
                // For simplicity, let's just make sure the subject isn't already assigned at all in the target class
                $subjectExists = $targetItems->contains('subject_id', $sourceItem->subject_id);

                if (!$subjectExists) {
                    $this->repo->create([
                        'tenant_id'       => $tenantId,
                        'academic_year_id' => $academicYearId,
                        'classroom_id'    => $targetClassroomId,
                        'subject_id'      => $sourceItem->subject_id,
                        'teacher_id'      => $sourceItem->teacher_id,
                        'hours_per_week'  => $sourceItem->hours_per_week,
                    ]);
                    $copiedCount++;
                }
            }
        }

        return $copiedCount;
    }
}
