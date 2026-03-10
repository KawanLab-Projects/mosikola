<?php

namespace App\Services;

use App\Models\Subject;

class SubjectService
{
    public function getByTenant(int $tenantId)
    {
        return Subject::where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get();
    }

    public function store(array $data): Subject
    {
        return Subject::create($data);
    }

    public function getByPublicId(string $publicId): ?Subject
    {
        return Subject::where('public_id', $publicId)->first();
    }

    public function update(string $publicId, array $data): bool
    {
        $subject = $this->getByPublicId($publicId);
        if (!$subject) return false;

        return $subject->update($data);
    }

    public function delete(string $publicId): bool
    {
        $subject = $this->getByPublicId($publicId);
        if (!$subject) return false;

        $subject->delete();
        return true;
    }
}
