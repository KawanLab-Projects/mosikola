<?php

namespace App\Repositories;

use App\Models\SchoolPeriod;
use Illuminate\Support\Collection;

class SchoolPeriodRepository
{
    public function getByTenant(int $tenantId): Collection
    {
        return SchoolPeriod::where('tenant_id', $tenantId)
            ->orderBy('period_number')
            ->get();
    }

    public function deleteByTenant(int $tenantId): void
    {
        SchoolPeriod::where('tenant_id', $tenantId)->delete();
    }

    public function bulkInsert(array $rows): void
    {
        SchoolPeriod::insert($rows);
    }
}
