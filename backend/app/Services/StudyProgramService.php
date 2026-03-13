<?php

namespace App\Services;

use App\Models\StudyProgram;
use App\Repositories\Contracts\StudyProgramRepoInterface;
use Illuminate\Support\Collection;

class StudyProgramService
{
    public function __construct(protected StudyProgramRepoInterface $studyProgramRepo) {}

    public function getAll(): Collection
    {
        return $this->studyProgramRepo->getAll();
    }

    public function getByTenant(int $tenantId): Collection
    {
        return $this->studyProgramRepo->getByTenant($tenantId);
    }

    public function getByPublicId(string $public_id): ?StudyProgram
    {
        return $this->studyProgramRepo->getByPublicId($public_id);
    }


    public function getById(int $id): ?StudyProgram
    {
        return $this->studyProgramRepo->getById($id);
    }

    public function store(array $data): StudyProgram
    {
        return $this->studyProgramRepo->create($data);
    }

    public function storeMany(array $data): void
    {
        $this->studyProgramRepo->createMany($data);
    }

    public function update(string $public_id, array $data): bool
    {
        $studyProgram = $this->getByPublicId($public_id);
        if (!$studyProgram) {
            return false;
        }
        return $this->studyProgramRepo->update($studyProgram->id, $data);
    }

    public function delete(string $public_id): bool
    {
        $studyProgram = $this->getByPublicId($public_id);
        if (!$studyProgram) {
            return false;
        }
        return $this->studyProgramRepo->delete($studyProgram->id);
    }
}
