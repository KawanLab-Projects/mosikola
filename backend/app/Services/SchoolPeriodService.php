<?php

namespace App\Services;

use App\Repositories\SchoolPeriodRepository;
use Illuminate\Support\Collection;

class SchoolPeriodService
{
    public function __construct(private SchoolPeriodRepository $repo) {}

    public function getByTenant(int $tenantId): Collection
    {
        return $this->repo->getByTenant($tenantId);
    }

    public function replace(int $tenantId, array $periods): void
    {
        $this->repo->deleteByTenant($tenantId);

        if (empty($periods)) {
            return;
        }

        $rows = array_map(fn($p) => [
            'tenant_id'     => $tenantId,
            'period_number' => $p['period_number'],
            'start_time'    => $p['start_time'],
            'end_time'      => $p['end_time'],
            'is_break'      => $p['is_break'] ?? false,
            'label'         => $p['label'] ?? null,
            'created_at'    => now(),
            'updated_at'    => now(),
        ], $periods);

        $this->repo->bulkInsert($rows);
    }
}
