<?php

namespace App\Repositories;

use App\Models\TenantRegistration;
use App\Repositories\Contracts\TenantRegistrationRepoInterface;

class TenantRegistrationRepository implements TenantRegistrationRepoInterface
{
    public function create(array $data): TenantRegistration
    {
        return TenantRegistration::create($data);
    }

    public function findBySlug(string $slug): ?TenantRegistration
    {
        return TenantRegistration::where('slug', $slug)->first();
    }

    public function existsBySlug(string $slug): bool
    {
        return TenantRegistration::where('slug', $slug)->exists();
    }

    public function all(): \Illuminate\Database\Eloquent\Collection
    {
        return TenantRegistration::with('plan')->latest()->get();
    }

    public function findById(int $id): ?TenantRegistration
    {
        return TenantRegistration::find($id);
    }

    public function updateStatus(int $id, string $status): bool
    {
        return TenantRegistration::where('id', $id)->update(['status' => $status]);
    }
}
