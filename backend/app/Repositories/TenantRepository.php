<?php

namespace App\Repositories;

use App\Models\Tenant;
use App\Repositories\Contracts\TenantRepoInterface;

class TenantRepository implements TenantRepoInterface
{
    public function create(array $data): Tenant
    {
        return Tenant::create($data);
    }

    public function getAllWithDetails(): \Illuminate\Database\Eloquent\Collection
    {
        return Tenant::with(['activeSubscription.plan'])->latest()->get();
    }
}
