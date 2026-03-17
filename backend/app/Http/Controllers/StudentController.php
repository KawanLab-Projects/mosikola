<?php

namespace App\Http\Controllers;

use App\Services\StudentService;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function __construct(protected StudentService $studentService) {}

    private function resolveTenantId(Request $request): ?int
    {
        $tenantUser = $request->user()->tenantUsers()->where('is_active', true)->first();

        return $tenantUser?->tenant_id;
    }

    public function index($classroomPublicId)
    {
        $students = $this->studentService->getStudentsByClassroom($classroomPublicId);

        return response()->json(['students' => $students]);
    }

    /** GET /students — fetch all students in tenant */
    public function indexByTenant(Request $request)
    {
        $tenantId = $this->resolveTenantId($request);
        if (! $tenantId) {
            return response()->json(['message' => 'Tenant tidak ditemukan.'], 403);
        }

        $students = $this->studentService->getStudentsByTenant($tenantId);

        return response()->json(['data' => $students]);
    }

    public function show($publicId)
    {
        $student = $this->studentService->getByPublicId($publicId);
        if (! $student) {
            return response()->json(['message' => 'Siswa tidak ditemukan.'], 404);
        }

        $student->load(['classroom', 'studentViolations.violation', 'tenant']);

        $totalPoints = $student->studentViolations->sum(function ($sv) {
            return $sv->violation ? $sv->violation->points : 0;
        });

        $studentArray = $student->toArray();
        $studentArray['total_points'] = $totalPoints;

        return response()->json([
            'data' => $studentArray,
        ]);
    }

    /** POST /classrooms/{classroom}/students */
    public function store(Request $request, $classroomPublicId)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'nisn' => 'required|string|max:20|unique:students,nisn',
            'birth_place' => 'nullable|string|max:255',
            'birth_date' => 'required|date',
            'address' => 'required|string|max:500',
            'parent_name' => 'required|string|max:255',
            'parent_phone' => 'required|string|max:20',
        ]);

        $data = $request->only([
            'name',
            'nisn',
            'birth_place',
            'birth_date',
            'address',
            'parent_name',
            'parent_phone',
        ]);

        try {
            $student = $this->studentService->create(
                $classroomPublicId,
                $data,
                $this->resolveTenantId($request)
            );

            return response()->json([
                'data' => $student,
                'message' => 'Siswa berhasil ditambahkan.',
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /** POST /classrooms/{classroom}/import-students */
    public function importStudents(Request $request, $classroomPublicId)
    {
        $request->validate(['file' => 'required|file|mimes:xlsx,xls,csv,txt|max:4096']);

        try {
            $this->studentService->importFromExcel(
                $classroomPublicId,
                $request->file('file'),
                $this->resolveTenantId($request)
            );

            return response()->json(['message' => 'Data siswa berhasil diimport.']);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function update(Request $request, $publicId)
    {
        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'birth_place' => 'nullable|string|max:255',
            'birth_date' => 'sometimes|required|date',
            'address' => 'sometimes|required|string|max:500',
            'parent_name' => 'sometimes|required|string|max:255',
            'parent_phone' => 'sometimes|required|string|max:20',
        ]);

        $data = $request->only([
            'name',
            'birth_place',
            'birth_date',
            'address',
            'parent_name',
            'parent_phone',
        ]);

        $student = $this->studentService->update($publicId, $data);

        return response()->json([
            'data' => $student,
            'message' => 'Data siswa berhasil diperbarui.',
        ]);
    }

    public function destroy($publicId)
    {
        $this->studentService->delete($publicId);

        return response()->json(['message' => 'Siswa berhasil dihapus.']);
    }
}
