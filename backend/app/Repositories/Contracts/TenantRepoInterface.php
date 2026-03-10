<?php

namespace App\Repositories\Contracts;

use App\Models\Tenant;

interface TenantRepoInterface
{
    public function create(array $data): Tenant;
    public function getAllWithDetails(): \Illuminate\Database\Eloquent\Collection;
}
