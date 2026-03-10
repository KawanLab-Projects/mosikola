<?php

namespace App\Repositories\Contracts;

use App\Models\Classroom;
use Illuminate\Support\Collection;

interface ClassroomRepoInterface
{
    public function getAll(): Collection;
    public function getById(int $id): ?Classroom;
    public function getByPublicId(string $public_id): ?Classroom;
    public function create(array $data): Classroom;
    public function update(int $id, array $data): bool;
    public function delete(int $id): bool;
}