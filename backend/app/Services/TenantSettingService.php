<?php

namespace App\Services;

use App\Repositories\TenantSettingRepository;
use Illuminate\Support\Collection;

class TenantSettingService
{
    // All valid groups, keys, and their default values
    public const SCHEMA = [
        'school' => [
            'principal_name' => '',
            'principal_nip' => '',
            'school_logo_url' => '',
            'school_address' => '',
        ],
        'schedule' => [
            'active_days' => '1,2,3,4,5',
            'active_semester' => 'ganjil',
            'holidays' => '',
            'default_period_duration_minutes' => '45',
            'shortened_period_days' => '',
        ],
        'attendance' => [
            'school_start_time' => '07:00',
            'school_end_time' => '14:00',
            'tolerance_late_minutes' => '15',
            'token_ttl_minutes' => '30',
            'absent_mode' => 'token',
            'kiosk_token' => '',
            'kiosk_inactivity_timeout_minutes' => '20',
        ],
        'discipline' => [
            'notify_threshold' => '3',
            'parent_notify_mode' => 'none',
            'points_validity' => 'academic_year',
            'action_threshold_sp1' => '25',
            'action_threshold_sp2' => '50',
            'action_threshold_parent_call' => '75',
            'action_threshold_suspension' => '100',
        ],
        'notify' => [
            'whatsapp_enabled' => 'false',
            'whatsapp_admin_number' => '',
        ],
    ];

    public function __construct(private TenantSettingRepository $repo) {}

    /**
     * Return all settings merged with schema defaults so the response
     * is always complete regardless of which keys have been saved.
     */
    public function getAll(int $tenantId): array
    {
        $saved = $this->repo->getAllByTenant($tenantId)
            ->groupBy('group')
            ->map(fn (Collection $items) => $items->pluck('value', 'key'));

        $result = [];
        foreach (self::SCHEMA as $group => $defaults) {
            $result[$group] = collect($defaults)->map(function ($default, $key) use ($saved, $group) {
                $value = $saved[$group][$key] ?? $default;
                if ($key === 'school_logo_url' && $value) {
                    if (str_starts_with($value, 'storage/')) {
                        return asset($value);
                    }

                    return \Illuminate\Support\Facades\Storage::disk('s3')->url($value);
                }

                return $value;
            });
        }

        return $result;
    }

    /**
     * Batch-upsert an array of [group, key, value] items.
     * Only keys present in the SCHEMA are accepted.
     */
    public function saveMany(int $tenantId, array $items): void
    {
        foreach ($items as $item) {
            $group = $item['group'];
            $key = $item['key'];

            if (! array_key_exists($key, self::SCHEMA[$group] ?? [])) {
                continue; // silently ignore unknown keys
            }

            $this->repo->upsert($tenantId, $group, $key, $item['value'] ?? null);
        }
    }
}
