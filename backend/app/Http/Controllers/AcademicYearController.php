<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\Student;
use App\Models\StudentGradeLog;
use App\Models\Tenant;
use App\Services\AcademicYearService;
use Illuminate\Http\Request;

class AcademicYearController extends Controller
{
    public function __construct(private AcademicYearService $service) {}

    /** GET /academic-years — list all years for authenticated tenant */
    public function index(Request $request)
    {
        $tenant = $this->resolveTenant($request);
        $years = $this->service->listByTenant($tenant->id);

        return response()->json(['data' => $years]);
    }

    /** GET /academic-years/active */
    public function active(Request $request)
    {
        $tenant = $this->resolveTenant($request);
        $year = $this->service->getActive($tenant->id);

        return response()->json(['data' => $year]);
    }

    /** POST /academic-years */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:20',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        $tenant = $this->resolveTenant($request);
        $year = $this->service->create($tenant->id, $request->only(['name', 'start_date', 'end_date']));

        return response()->json(['data' => $year, 'message' => 'Tahun ajaran berhasil dibuat.'], 201);
    }

    /** PUT /academic-years/{id}/activate */
    public function activate(Request $request, int $id)
    {
        $tenant = $this->resolveTenant($request);
        $year = $this->service->activate($id, $tenant->id);

        return response()->json(['data' => $year, 'message' => 'Tahun ajaran berhasil diaktifkan.']);
    }

    /** POST /academic-years/{id}/close — close year and trigger grade-up */
    public function close(Request $request, int $id)
    {
        $tenant = $this->resolveTenant($request);
        $year = $this->service->getActive($tenant->id);

        if (! $year || $year->id !== $id) {
            return response()->json(['message' => 'Tahun ajaran aktif tidak cocok.'], 422);
        }

        $this->service->closeYear($year, $tenant, $request->user()->id);

        return response()->json(['message' => 'Tahun ajaran berhasil ditutup dan kenaikan kelas telah diproses.']);
    }

    /** PUT /academic-years/{id}/toggle-schedule-lock */
    public function toggleScheduleLock(Request $request, int $id)
    {
        $tenant = $this->resolveTenant($request);
        $year = \App\Models\AcademicYear::where('tenant_id', $tenant->id)->findOrFail($id);

        $year->is_schedule_locked = ! $year->is_schedule_locked;
        $year->save();

        return response()->json([
            'message' => $year->is_schedule_locked
                ? 'Jadwal berhasil dikunci. Fitur reset jadwal dinonaktifkan.'
                : 'Kunci jadwal dibuka. Fitur reset jadwal diaktifkan kembali.',
            'data' => $year,
        ]);
    }

    /** POST /students/{student}/demote */
    public function demoteStudent(Request $request, string $studentPublicId)
    {
        $request->validate([
            'classroom_public_id' => 'required|string|exists:classrooms,public_id',
            'academic_year_id' => 'required|integer|exists:academic_years,id',
        ]);

        $student = Student::where('public_id', $studentPublicId)->firstOrFail();
        $classroom = Classroom::where('public_id', $request->classroom_public_id)->firstOrFail();

        $this->service->demoteStudent($student, $classroom, $request->academic_year_id, $request->user()->id);

        return response()->json(['message' => 'Siswa berhasil dikembalikan ke kelas sebelumnya.']);
    }

    /** GET /academic-years/{id}/grade-logs */
    public function gradeLogs(Request $request, int $id)
    {
        $logs = StudentGradeLog::where('academic_year_id', $id)
            ->with(['student', 'fromClassroom', 'toClassroom'])
            ->get();

        return response()->json(['data' => $logs]);
    }

    /** Resolve the tenant from the authenticated user */
    private function resolveTenant(Request $request): Tenant
    {
        $tenantUser = $request->user()->tenantUsers()->where('is_active', true)->with('tenant')->first();

        abort_if(! $tenantUser, 403, 'Akses ditolak.');

        return $tenantUser->tenant;
    }
}
