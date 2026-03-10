<?php

namespace App\Repositories\Contracts;

use App\Models\User;

interface UserRepoInterface
{
    public function create(array $data, string $role): User;
}
