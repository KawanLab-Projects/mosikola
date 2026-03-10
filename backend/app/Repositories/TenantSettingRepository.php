<?php

namespace App\Repositories;

use App\Models\TenantSetting;
use Illuminate\Support\Collection;

class TenantSettingRepository
{
    public function getAllByTenant(int $tenantId): Collection
    {
        return TenantSetting::where('tenant_id', $tenantId)->get();
    }

    public function upsert(int $tenantId, string $group, string $key, ?string $value): void
    {
        TenantSetting::updateOrCreate(
            ['tenant_id' => $tenantId, 'group' => $group, 'key' => $key],
            ['value' => $value]
        );
    }
}
