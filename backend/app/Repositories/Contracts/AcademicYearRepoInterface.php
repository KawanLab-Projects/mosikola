<?php

namespace App\Repositories\Contracts;

use App\Models\AcademicYear;
use Illuminate\Support\Collection;

interface AcademicYearRepoInterface
{
    public function findActive(int $tenantId): ?AcademicYear;

    public function findByTenant(int $tenantId): Collection;

    public function findById(int $id): ?AcademicYear;

    public function create(array $data): AcademicYear;

    public function setActive(int $id, int $tenantId): void;

    public function update(int $id, array $data): bool;
}
