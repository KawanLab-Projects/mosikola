<?php

namespace App\Http\Controllers;

use App\Services\ClassroomService;
use App\Services\StudentService;
use Illuminate\Http\Request;

class ClassroomController extends Controller
{
    public function __construct(
        protected ClassroomService $service,
        protected StudentService $studentService
    ) {}

    public function index($studyProgramPublicId)
    {
        $classroom = $this->service->getAllByStudyProgram($studyProgramPublicId);

        return response()->json([
            'data' => $classroom,
        ]);
    }

    /** GET /classrooms — returns all classrooms belonging to the tenant (for SD/SMP). */
    public function indexByTenant(Request $request)
    {
        $tenantUser = $request->user()->tenantUsers()->where('is_active', true)->with('tenant')->first();
        abort_if(! $tenantUser, 403, 'Akses ditolak.');

        $classrooms = $this->service->getAllByTenant($tenantUser->tenant->id);

        return response()->json(['data' => $classrooms]);
    }

    public function store(Request $request, $studyProgram)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'short' => 'required|string|max:255',
            'grade_level' => 'required|integer|min:1|max:12',
        ]);

        $data = $request->only(['name', 'short', 'grade_level']);

        return response()->json([
            'data' => $this->service->store(array_merge($data, [
                'study_program_public_id' => $studyProgram,
            ])),
            'message' => 'Ruang kelas berhasil ditambahkan.',
        ], 201);
    }

    /** POST /classrooms — SD/SMP direct creation without jurusan */
    public function storeDirectly(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'short' => 'required|string|max:255',
            'grade_level' => 'required|integer|min:1|max:12',
        ]);

        $tenantUser = $request->user()->tenantUsers()->where('is_active', true)->with('tenant')->first();
        abort_if(! $tenantUser, 403, 'Akses ditolak.');

        return response()->json([
            'data' => $this->service->store(array_merge(
                $request->only(['name', 'short', 'grade_level']),
                ['tenant_id' => $tenantUser->tenant->id]
            )),
            'message' => 'Ruang kelas berhasil ditambahkan.',
        ], 201);
    }

    public function show($public_id)
    {
        $classroom = $this->service->getByPublicId($public_id);
        if (! $classroom) {
            return response()->json(['message' => 'Ruang kelas tidak ditemukan.'], 404);
        }

        return response()->json([
            'data' => $classroom,
        ]);
    }

    public function update(Request $request, $public_id)
    {
        $classroom = $this->service->getByPublicId($public_id);
        if (! $classroom) {
            return response()->json(['message' => 'Ruang kelas tidak ditemukan.'], 404);
        }

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'short' => 'sometimes|required|string|max:255',
            'grade_level' => 'sometimes|required|integer|min:1|max:12',
            'study_program_public_id' => 'nullable|string|exists:study_programs,public_id',
        ]);

        $data = $request->only(['name', 'short', 'grade_level', 'study_program_public_id']);

        $this->service->update($classroom->id, $data);

        return response()->json([
            'message' => 'Ruang kelas berhasil diperbarui.',
        ]);
    }

    public function destroy($public_id)
    {
        $classroom = $this->service->getByPublicId($public_id);
        if (! $classroom) {
            return response()->json(['message' => 'Ruang kelas tidak ditemukan.'], 404);
        }

        $this->service->delete($classroom->id);

        return response()->json([
            'message' => 'Ruang kelas berhasil dihapus.',
        ]);
    }

    public function importStudents(Request $request, string $classroomPublicId)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv,txt|max:4096',
        ]);

        $tenantUser = $request->user()->tenantUsers()->where('is_active', true)->first();
        $tenantId = $tenantUser ? $tenantUser->tenant_id : null;

        try {
            $this->studentService->importFromExcel(
                $classroomPublicId,
                $request->file('file'),
                $tenantId
            );

            return response()->json([
                'message' => 'Data siswa berhasil diimport',
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function downloadTemplate()
    {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\StudentTemplateExport, 'template_siswa.xlsx');
    }

    public function getStudents($public_id)
    {
        $classroom = $this->service->getByPublicId($public_id);
        if (! $classroom) {
            return response()->json(['message' => 'Ruang kelas tidak ditemukan.'], 404);
        }

        $students = $this->studentService->getStudentsByClassroom($classroom->id);

        return response()->json([
            'data' => $students,
        ]);
    }
}
