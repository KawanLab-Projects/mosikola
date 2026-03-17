<?php

namespace App\Repositories;

use App\Models\Classroom;
use Illuminate\Support\Collection;

interface ClassroomRepoInterface
{
    public function getAllByStudyProgram(int $studyProgramId): Collection;

    public function getAllByTenant(int $tenantId): Collection;

    public function getById(int $id): ?Classroom;

    public function getByPublicId(string $public_id): ?Classroom;

    public function create(array $data): Classroom;

    public function update(int $id, array $data): bool;

    public function delete(int $id): bool;
}

class ClassroomRepository implements ClassroomRepoInterface
{
    public function getAllByStudyProgram(int $studyProgramId): Collection
    {
        return Classroom::with(['studyProgram', 'homeroomAssignment.teacher'])
            ->where('study_program_id', $studyProgramId)
            ->orderBy('grade_level')
            ->orderBy('name')
            ->get();
    }

    public function getAllByTenant(int $tenantId): Collection
    {
        return Classroom::where(function ($q) use ($tenantId) {
            // SD/SMP classrooms: no study_program, scoped directly by tenant_id
            $q->where('tenant_id', $tenantId)->whereNull('study_program_id');
        })
            ->orWhereHas('studyProgram', fn ($q) => $q->where('tenant_id', $tenantId))
            ->with(['studyProgram', 'homeroomAssignment.teacher'])
            ->orderBy('grade_level')
            ->orderBy('name')
            ->get();
    }

    public function getByPublicId(string $public_id): ?Classroom
    {
        return Classroom::where('public_id', $public_id)->first();
    }

    public function getById(int $id): ?Classroom
    {
        return Classroom::find($id);
    }

    public function create(array $data): Classroom
    {
        return Classroom::create($data)->makeHidden(['id']);
    }

    public function update(int $id, array $data): bool
    {
        $classroom = Classroom::findOrFail($id);
        $classroom->update($data);

        return true;
    }

    public function delete(int $id): bool
    {
        return Classroom::destroy($id) > 0;
    }
}
