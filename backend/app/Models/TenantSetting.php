<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TenantSetting extends Model
{
    protected $fillable = ['tenant_id', 'group', 'key', 'value'];

    protected $hidden = ['id'];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Helper: get setting value for a tenant.
     */
    public static function getValue(int $tenantId, string $group, string $key, mixed $default = null): mixed
    {
        $setting = static::where('tenant_id', $tenantId)
            ->where('group', $group)
            ->where('key', $key)
            ->first();

        return $setting ? $setting->value : $default;
    }

    /**
     * Helper: upsert a single setting.
     */
    public static function setValue(int $tenantId, string $group, string $key, mixed $value): void
    {
        static::updateOrCreate(
            ['tenant_id' => $tenantId, 'group' => $group, 'key' => $key],
            ['value' => $value]
        );
    }
}
