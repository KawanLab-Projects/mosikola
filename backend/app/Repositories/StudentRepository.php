<?php

namespace App\Repositories;

use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Collection;

interface StudentRepoInterface
{
    public function create(array $data): Student;

    public function getByClassroomId(int $classroomId): ?Collection;

    public function getById(int $id): ?Student;

    public function getByPublicId(string $public_id): ?Student;

    public function getByUserId(int $user_id): ?Student;

    public function getByParentPhone(string $parentPhone): Collection;

    public function countByTenantId(int $tenantId): int;

    public function getByTenantId(int $tenantId): Collection;

    public function update(Student $student, array $data): Student;

    public function delete(Student $student): void;
}

class StudentRepository implements StudentRepoInterface
{
    public function create(array $data): Student
    {
        return Student::create($data);
    }

    public function getByClassroomId(int $classroomId): ?Collection
    {
        return Student::where('classroom_id', $classroomId)->get();
    }

    public function getById(int $id): ?Student
    {
        return Student::where('id', $id)->first();
    }

    public function getByPublicId(string $public_id): ?Student
    {
        return Student::where('public_id', $public_id)->first();
    }

    public function getByUserId(int $user_id): ?Student
    {
        return Student::where('user_id', $user_id)->first();
    }

    public function getByParentPhone(string $parentPhone): Collection
    {
        return Student::where('parent_phone', $parentPhone)->get();
    }

    public function countByTenantId(int $tenantId): int
    {
        return Student::where('tenant_id', $tenantId)->count();
    }

    public function getByTenantId(int $tenantId): Collection
    {
        return Student::where('tenant_id', $tenantId)->get();
    }

    public function update(Student $student, array $data): Student
    {
        $user = User::where('id', $student->user_id)->first();
        $user->update(['name' => $data['name']]);
        $user->save();

        $student->update($data);

        return $student;
    }

    public function delete(Student $student): void
    {
        $user = User::where('id', $student->user_id)->first();
        $user->delete();
        $student->delete();
    }
}
