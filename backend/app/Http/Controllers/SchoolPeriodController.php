<?php

namespace App\Http\Controllers;

use App\Services\SchoolPeriodService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SchoolPeriodController extends Controller
{
    public function __construct(private SchoolPeriodService $service) {}

    private function resolveTenantId(Request $request): int
    {
        $tenantUser = $request->user()->tenantUsers()->where('is_active', true)->first();
        abort_if(! $tenantUser, 403, 'Akses ditolak.');

        return $tenantUser->tenant_id;
    }

    /** GET /school-periods */
    public function index(Request $request): JsonResponse
    {
        $tenantId = $this->resolveTenantId($request);

        return response()->json(['data' => $this->service->getByTenant($tenantId)]);
    }

    /** POST /school-periods (bulk replace) */
    public function bulkReplace(Request $request): JsonResponse
    {
        $request->validate([
            'periods' => 'required|array',
            'periods.*.period_number' => 'required|integer|min:1|max:20',
            'periods.*.start_time' => 'required|date_format:H:i:s,H:i',
            'periods.*.end_time' => 'required|date_format:H:i:s,H:i',
            'periods.*.is_break' => 'boolean',
            'periods.*.label' => 'nullable|string|max:100',
        ]);

        $tenantId = $this->resolveTenantId($request);
        $this->service->replace($tenantId, $request->input('periods'));

        return response()->json([
            'message' => 'Konfigurasi jam sekolah berhasil disimpan.',
            'data' => $this->service->getByTenant($tenantId),
        ]);
    }
}
