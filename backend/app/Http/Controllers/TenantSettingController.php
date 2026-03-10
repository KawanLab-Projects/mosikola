<?php

namespace App\Http\Controllers;

use App\Services\TenantSettingService;
use Illuminate\Http\Request;

class TenantSettingController extends Controller
{
    public function __construct(private TenantSettingService $service) {}

    private function resolveTenantId(Request $request): int
    {
        $tenantUser = $request->user()->tenantUsers()->where('is_active', true)->first();
        abort_if(!$tenantUser, 403, 'Akses ditolak.');
        return $tenantUser->tenant_id;
    }

    /** GET /settings */
    public function index(Request $request)
    {
        return response()->json([
            'data' => $this->service->getAll($this->resolveTenantId($request)),
        ]);
    }

    /** PUT /settings */
    public function update(Request $request)
    {
        $request->validate([
            'settings'         => 'required|array',
            'settings.*.group' => 'required|string|in:' . implode(',', array_keys(TenantSettingService::SCHEMA)),
            'settings.*.key'   => 'required|string',
            'settings.*.value' => 'nullable|string',
        ]);

        $this->service->saveMany(
            $this->resolveTenantId($request),
            $request->input('settings')
        );

        return response()->json(['message' => 'Pengaturan berhasil disimpan.']);
    }

    /** POST /settings/logo */
    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|max:2048', // max 2MB
        ]);

        $tenantId = $this->resolveTenantId($request);

        $path = $request->file('logo')->store('tenant-logos', 'public');

        $this->service->saveMany($tenantId, [
            [
                'group' => 'school',
                'key' => 'school_logo_url',
                'value' => $path
            ]
        ]);

        return response()->json([
            'message' => 'Logo berhasil diunggah.',
            'path' => $path
        ]);
    }
}
