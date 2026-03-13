<?php

namespace App\Repositories;

use App\Models\StudyProgram;
use App\Repositories\Contracts\StudyProgramRepoInterface;
use Illuminate\Support\Collection;

class StudyProgramRepository implements StudyProgramRepoInterface
{
    // Implementation of the interface methods will go here
    public function getAll(): Collection
    {
        return StudyProgram::orderBy('name')->get();
    }

    public function getByTenant(int $tenantId): Collection
    {
        return StudyProgram::where('tenant_id', $tenantId)->orderBy('name')->get();
    }

    public function getById(int $id): ?StudyProgram
    {
        return StudyProgram::find($id);
    }

    public function getByPublicId(string $public_id): ?StudyProgram
    {
        return StudyProgram::where('public_id', $public_id)->first();
    }

    public function create(array $data): StudyProgram
    {
        return StudyProgram::create($data)->makeHidden(['id']);
    }

    public function createMany(array $data): void
    {
        StudyProgram::insert($data);
    }

    public function update(int $id, array $data): bool
    {
        $studyProgram = StudyProgram::findOrFail($id);
        $studyProgram->update($data);
        return true;
    }

    public function delete(int $id): bool
    {
        return StudyProgram::destroy($id) > 0;
    }
}
