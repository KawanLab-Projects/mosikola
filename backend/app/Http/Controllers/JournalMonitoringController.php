<?php

namespace App\Http\Controllers;

use App\Services\JournalMonitoringService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JournalMonitoringController extends Controller
{
    public function __construct(private JournalMonitoringService $service) {}

    /**
     * GET /api/journal-monitoring
     * Validates input (start_date, end_date) and resolves the authenticated admin's tenant.
     * Delegates the actual query orchestration to JournalMonitoringService.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
            'academic_year_id' => 'nullable|integer|exists:academic_years,id',
        ]);

        $tenantUser = $request->user()->tenantUsers()->where('is_active', true)->first();
        abort_if(! $tenantUser, 403, 'Akses ditolak.');

        $data = $this->service->getWeeklyMonitoring(
            $tenantUser->tenant_id,
            $request->start_date,
            $request->end_date,
            $request->integer('academic_year_id') ?: null
        );

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}
