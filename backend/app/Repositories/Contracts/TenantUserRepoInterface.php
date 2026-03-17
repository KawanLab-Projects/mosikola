<?php

namespace App\Repositories\Contracts;

use App\Models\TenantUser;

interface TenantUserRepoInterface
{
    public function create(array $data): TenantUser;

    public function firstOrCreate(array $attributes, array $values = []): TenantUser;
}
