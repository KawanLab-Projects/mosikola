<?php

namespace App\Repositories;

use App\Models\AcademicYear;
use App\Repositories\Contracts\AcademicYearRepoInterface;
use Illuminate\Support\Collection;

class AcademicYearRepository implements AcademicYearRepoInterface
{
    public function findActive(int $tenantId): ?AcademicYear
    {
        return AcademicYear::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->first();
    }

    public function findByTenant(int $tenantId): Collection
    {
        return AcademicYear::where('tenant_id', $tenantId)
            ->orderBy('start_date', 'desc')
            ->get();
    }

    public function findById(int $id): ?AcademicYear
    {
        return AcademicYear::find($id);
    }

    public function create(array $data): AcademicYear
    {
        return AcademicYear::create($data);
    }

    public function setActive(int $id, int $tenantId): void
    {
        // Deactivate all years for this tenant first
        AcademicYear::where('tenant_id', $tenantId)->update(['is_active' => false]);
        // Then activate the chosen one
        AcademicYear::where('id', $id)->update(['is_active' => true]);
    }

    public function update(int $id, array $data): bool
    {
        return (bool) AcademicYear::where('id', $id)->update($data);
    }
}
