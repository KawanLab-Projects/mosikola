<?php

namespace App\Repositories;

use App\Models\StudentViolation;
use App\Models\Violation;
use Illuminate\Support\Collection;

interface ViolationRepoInterface
{
    public function getAllByTenant(int $tenantId): Collection;
    public function getById(int $id): ?Violation;
    public function create(array $data): Violation;
    public function update(Violation $violation, array $data): bool;
    public function delete(Violation $violation): bool;
    public function isUsedByStudentViolation(int $violationId): bool;
}

class ViolationRepository implements ViolationRepoInterface
{
    public function getAllByTenant(int $tenantId): Collection
    {
        return Violation::where('tenant_id', $tenantId)
            ->orderBy('points', 'asc')
            ->get();
    }

    public function getById(int $id): ?Violation
    {
        return Violation::find($id);
    }

    public function create(array $data): Violation
    {
        return Violation::create($data);
    }

    public function update(Violation $violation, array $data): bool
    {
        return $violation->update($data);
    }

    public function delete(Violation $violation): bool
    {
        return $violation->delete();
    }

    public function isUsedByStudentViolation(int $violationId): bool
    {
        return StudentViolation::where('violation_id', $violationId)->exists();
    }
}
