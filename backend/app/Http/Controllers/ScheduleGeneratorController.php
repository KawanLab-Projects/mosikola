<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Repositories\ScheduleGeneratorRepository;
use App\Services\ScheduleGeneratorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleGeneratorController extends Controller
{
    public function __construct(
        private ScheduleGeneratorService $service,
        private ScheduleGeneratorRepository $repo,
    ) {}

    private function resolveTenantId(Request $request): int
    {
        $tenantUser = $request->user()->tenantUsers()->where('is_active', true)->first();
        abort_if(! $tenantUser, 403, 'Akses ditolak.');

        return $tenantUser->tenant_id;
    }

    /**
     * POST /schedule/generate
     * Runs the algorithm and returns a preview. Does NOT save to DB yet.
     */
    public function generate(Request $request): JsonResponse
    {
        $request->validate([
            'academic_year_id' => 'required|integer|exists:academic_years,id',
        ]);

        $tenantId = $this->resolveTenantId($request);
        $academicYearId = (int) $request->input('academic_year_id');

        $year = AcademicYear::find($academicYearId);
        abort_if($year?->is_schedule_locked, 422, 'Jadwal untuk tahun ajaran ini sudah dikunci.');

        $result = $this->service->generate($tenantId, $academicYearId);

        return response()->json([
            'data' => [
                'total' => count($result['assigned']),
                'unresolved_count' => count($result['unresolved']),
                'unresolved' => $result['unresolved'],
                'preview' => $result['assigned'],
            ],
        ]);
    }

    /**
     * POST /schedule/generate/commit
     * Re-runs the algorithm and commits the result to the schedules table.
     */
    public function commit(Request $request): JsonResponse
    {
        $request->validate([
            'academic_year_id' => 'required|integer|exists:academic_years,id',
        ]);

        $tenantId = $this->resolveTenantId($request);
        $academicYearId = (int) $request->input('academic_year_id');

        $year = AcademicYear::find($academicYearId);
        abort_if($year?->is_schedule_locked, 422, 'Jadwal untuk tahun ajaran ini sudah dikunci.');

        $result = $this->service->generate($tenantId, $academicYearId);

        $this->repo->deleteByYear($tenantId, $academicYearId);
        $this->repo->bulkInsert($result['assigned']);

        return response()->json([
            'message' => 'Jadwal berhasil disimpan.',
            'data' => [
                'total' => count($result['assigned']),
                'unresolved_count' => count($result['unresolved']),
                'unresolved' => $result['unresolved'],
            ],
        ]);
    }
}
