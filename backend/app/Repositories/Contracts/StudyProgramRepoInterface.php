<?php

namespace App\Repositories\Contracts;

use App\Models\StudyProgram;
use Illuminate\Support\Collection;

interface StudyProgramRepoInterface
{
    public function getAll(): Collection;

    public function getByTenant(int $tenantId): Collection;

    public function getByPublicId(string $public_id): ?StudyProgram;

    public function getById(int $id): ?StudyProgram;

    public function create(array $data): StudyProgram;

    public function update(int $id, array $data): bool;

    public function delete(int $id): bool;
}
