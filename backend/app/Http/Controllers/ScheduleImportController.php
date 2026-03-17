<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Services\AscXmlImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleImportController extends Controller
{
    public function __construct(private AscXmlImportService $importService) {}

    /**
     * Parse the uploaded XML and return a name-matching preview.
     * No data is written to the database.
     *
     * POST /api/schedule-imports/preview
     */
    public function preview(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xml,txt|max:10240',
            'academic_year_id' => 'required|integer',
        ]);

        $tenantId = $this->getTenantId();

        $tenant = \App\Models\Tenant::find($tenantId);
        $subscription = $tenant->subscriptions()->with('plan')->where('is_active', true)->first();
        if (! $subscription || ! ($subscription->plan->features['import_schedule'] ?? false)) {
            return response()->json([
                'success' => false,
                'message' => 'Paket langganan Anda tidak mendukung Import Jadwal. Silakan upgrade paket Anda.',
            ], 403);
        }

        $academicYearId = (int) $request->input('academic_year_id');
        $xmlContent = file_get_contents($request->file('file')->getRealPath());

        try {
            $preview = $this->importService->preview($xmlContent, $tenantId, $academicYearId);

            return response()->json([
                'success' => true,
                'data' => $preview,
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Confirm the import: write resolved schedule rows to the database.
     *
     * POST /api/schedule-imports/confirm
     */
    public function confirm(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xml,txt|max:10240',
            'academic_year_id' => 'required|integer',
            'auto_create.subjects' => 'sometimes|array',
            'auto_create.subjects.*' => 'string',
            'auto_create.classrooms' => 'sometimes|array',
            'auto_create.classrooms.*' => 'string',
            'auto_create.teachers' => 'sometimes|array',
            'auto_create.teachers.*' => 'string',
        ]);

        $tenantId = $this->getTenantId();

        $tenant = \App\Models\Tenant::find($tenantId);
        $subscription = $tenant->subscriptions()->with('plan')->where('is_active', true)->first();
        if (! $subscription || ! ($subscription->plan->features['import_schedule'] ?? false)) {
            return response()->json([
                'success' => false,
                'message' => 'Paket langganan Anda tidak mendukung Import Jadwal. Silakan upgrade paket Anda.',
            ], 403);
        }

        $academicYearId = (int) $request->input('academic_year_id');
        $file = $request->file('file');
        $xmlContent = file_get_contents($file->getRealPath());
        $filename = $file->getClientOriginalName();

        $autoCreate = [
            'subjects' => $request->input('auto_create.subjects', []),
            'classrooms' => $request->input('auto_create.classrooms', []),
            'teachers' => $request->input('auto_create.teachers', []),
        ];

        try {
            $result = $this->importService->confirm($xmlContent, $tenantId, $academicYearId, $filename, $autoCreate);

            $ac = $result['auto_created'];
            $acParts = array_filter([
                $ac['subjects'] ? "{$ac['subjects']} mapel baru" : null,
                $ac['classrooms'] ? "{$ac['classrooms']} kelas baru" : null,
                $ac['teachers'] ? "{$ac['teachers']} guru baru" : null,
            ]);

            $message = "Berhasil mengimpor {$result['written']} jadwal.";
            if ($acParts) {
                $message .= ' Dibuat otomatis: '.implode(', ', $acParts).'.';
            }
            if ($result['skipped'] > 0) {
                $message .= " {$result['skipped']} kartu dilewati.";
            }
            if ($result['assignments_created'] > 0) {
                $message .= " {$result['assignments_created']} penugasan guru mapel baru ditambahkan.";
            }

            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => $message,
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * List all imported schedules for the active academic year.
     *
     * GET /api/schedules
     */
    public function index(Request $request): JsonResponse
    {
        $tenantId = $this->getTenantId();

        $query = \App\Models\Schedule::with(['classroom', 'subject', 'teacher'])
            ->where('tenant_id', $tenantId);

        if ($request->has('academic_year_id')) {
            $query->where('academic_year_id', $request->integer('academic_year_id'));
        }

        if ($request->has('classroom_id')) {
            $query->where('classroom_id', $request->integer('classroom_id'));
        }

        if ($request->has('teacher_id')) {
            $query->where('teacher_id', $request->integer('teacher_id'));
        }

        if ($request->has('day_of_week')) {
            $query->where('day_of_week', $request->integer('day_of_week'));
        }

        $schedules = $query->orderBy('day_of_week')->orderBy('period_start')->get();

        return response()->json([
            'success' => true,
            'data' => $schedules,
        ]);
    }

    // -------------------------------------------------------------------------
    // Helper
    // -------------------------------------------------------------------------

    /**
     * Delete all schedules (and cascade lesson_journals) for the academic year.
     *
     * DELETE /api/schedules
     */
    public function reset(Request $request): JsonResponse
    {
        $request->validate(['academic_year_id' => 'required|integer']);

        $tenantId = $this->getTenantId();
        $academicYearId = (int) $request->input('academic_year_id');

        $year = AcademicYear::where('tenant_id', $tenantId)->findOrFail($academicYearId);
        if ($year->is_schedule_locked) {
            return response()->json([
                'success' => false,
                'message' => 'Jadwal terkunci. Silakan buka kunci terlebih dahulu di menu pengaturan untuk mereset jadwal.',
            ], 400);
        }

        $deleted = \App\Models\Schedule::where('tenant_id', $tenantId)
            ->where('academic_year_id', $academicYearId)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => "{$deleted} jadwal berhasil dihapus.",
            'deleted' => $deleted,
        ]);
    }

    private function getTenantId(): int
    {
        $tenantUser = request()->user()->tenantUsers()->where('is_active', true)->first();
        abort_if(! $tenantUser, 403, 'Akses ditolak.');

        return $tenantUser->tenant_id;
    }
}
