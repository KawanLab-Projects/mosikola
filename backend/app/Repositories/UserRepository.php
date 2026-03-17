<?php

namespace App\Repositories;

use App\Models\User;
use App\Repositories\Contracts\UserRepoInterface;

class UserRepository implements UserRepoInterface
{
    public function create(array $data, string $role): User
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'], // Model 'hashed' cast handles hashing
        ]);

        $user->assignRole($role);

        return $user;
    }
}
