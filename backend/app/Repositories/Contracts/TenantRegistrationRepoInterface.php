<?php

namespace App\Repositories\Contracts;

use App\Models\TenantRegistration;

interface TenantRegistrationRepoInterface
{
    public function create(array $data): TenantRegistration;

    public function findBySlug(string $slug): ?TenantRegistration;

    public function existsBySlug(string $slug): bool;

    public function all(): \Illuminate\Database\Eloquent\Collection;

    public function findById(int $id): ?TenantRegistration;

    public function updateStatus(int $id, string $status): bool;
}
