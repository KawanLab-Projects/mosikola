<?php

namespace App\Http\Controllers;

use App\Repositories\TeacherRepository;
use App\Services\TeacherUnavailabilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherUnavailabilityController extends Controller
{
    public function __construct(
        private TeacherUnavailabilityService $service,
        private TeacherRepository $teacherRepo,
    ) {}

    private function resolveTenantId(Request $request): int
    {
        $tenantUser = $request->user()->tenantUsers()->where('is_active', true)->first();
        abort_if(! $tenantUser, 403, 'Akses ditolak.');

        return $tenantUser->tenant_id;
    }

    /** GET /teachers/{teacherPublicId}/unavailabilities?academic_year_id=X */
    public function index(Request $request, string $teacherPublicId): JsonResponse
    {
        $request->validate(['academic_year_id' => 'required|integer']);

        $teacherId = \App\Models\Teacher::where('public_id', $teacherPublicId)->value('id');
        abort_if(! $teacherId, 404, 'Guru tidak ditemukan.');

        $slots = $this->service->getByTeacherAndYear($teacherId, (int) $request->query('academic_year_id'));

        return response()->json(['data' => $slots]);
    }

    /** POST /teachers/{teacherPublicId}/unavailabilities (bulk replace) */
    public function replace(Request $request, string $teacherPublicId): JsonResponse
    {
        $request->validate([
            'academic_year_id' => 'required|integer|exists:academic_years,id',
            'slots' => 'required|array',
            'slots.*.day_of_week' => 'required|integer|between:1,5',
            'slots.*.period_number' => 'required|integer|min:1',
        ]);

        $teacherId = \App\Models\Teacher::where('public_id', $teacherPublicId)->value('id');
        abort_if(! $teacherId, 404, 'Guru tidak ditemukan.');

        $tenantId = $this->resolveTenantId($request);
        $this->service->replace(
            $tenantId,
            $teacherId,
            $request->input('academic_year_id'),
            $request->input('slots')
        );

        return response()->json(['message' => 'Ketersediaan guru berhasil disimpan.']);
    }
}
