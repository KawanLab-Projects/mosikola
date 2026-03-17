<?php

namespace App\Repositories;

use App\Models\Teacher;
use Illuminate\Support\Collection;

interface TeacherRepoInterface
{
    public function all(): Collection;

    public function getByTenant(int $tenantId): Collection;

    public function getById(int $id);

    public function getByPublicId(string $public_id);

    public function create(array $data);

    public function update($teacher, array $data);

    public function delete($teacher): void;
}

class TeacherRepository implements TeacherRepoInterface
{
    public function all(): Collection
    {
        return Teacher::orderBy('name')->get();
    }

    public function getByTenant(int $tenantId): Collection
    {
        return Teacher::where('tenant_id', $tenantId)
            ->with(['user', 'assignments.classroom', 'assignments.academicYear', 'guruWaliStudents'])
            ->orderBy('name')
            ->get();
    }

    public function getById(int $id)
    {
        return Teacher::where('id', $id)->first();
    }

    public function getByPublicId(string $public_id)
    {
        return Teacher::where('public_id', $public_id)->first();
    }

    public function create(array $data)
    {
        return Teacher::create($data);
    }

    public function update($teacher, array $data)
    {
        $teacher->update($data);

        return $teacher;
    }

    public function delete($teacher): void
    {
        $teacher->delete();
    }
}
