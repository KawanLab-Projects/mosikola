<?php

namespace App\Repositories;

use App\Models\TenantUser;
use App\Repositories\Contracts\TenantUserRepoInterface;

class TenantUserRepository implements TenantUserRepoInterface
{
    public function create(array $data): TenantUser
    {
        return TenantUser::create($data);
    }

    public function firstOrCreate(array $attributes, array $values = []): TenantUser
    {
        return TenantUser::firstOrCreate($attributes, $values);
    }
}
