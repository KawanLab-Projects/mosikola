<?php

namespace App\Http\Controllers;

use App\Services\TeacherService;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    public function __construct(private TeacherService $teacherService) {}

    private function resolveTenant(Request $request)
    {
        $tenantUser = $request->user()->tenantUsers()->where('is_active', true)->with('tenant')->first();
        abort_if(!$tenantUser, 403, 'Akses ditolak.');
        return $tenantUser->tenant;
    }

    /** GET /teachers */
    public function index(Request $request)
    {
        $tenant = $this->resolveTenant($request);
        $teachers = $this->teacherService->getByTenant($tenant->id);

        $teachers->transform(function ($teacher) {
            $assignments = $teacher->assignments ?? collect();

            if ($teacher->relationLoaded('guruWaliStudents')) {
                // Group by academic year to only show one badge per year
                $guruWaliYears = $teacher->guruWaliStudents->pluck('academic_year_id')->unique();
                foreach ($guruWaliYears as $yearId) {
                    $assignments->push((object)[
                        'id' => 'gw_' . $yearId,
                        'assignment_type' => 'guru_wali',
                        'academic_year_id' => $yearId,
                    ]);
                }
            }

            $teacher->setRelation('assignments', $assignments);
            return $teacher;
        });

        return response()->json(['data' => $teachers]);
    }

    /** POST /teachers */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'  => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'nip'   => 'nullable|string|unique:teachers,nip',
        ]);

        $data['tenant_id'] = $this->resolveTenant($request)->id;
        $teacher = $this->teacherService->createWithUser($data);

        return response()->json([
            'message' => 'Guru berhasil ditambahkan.',
            'teacher' => $teacher,
        ], 201);
    }

    /** PUT /teachers/{teacher} */
    public function update(Request $request, $teacherId)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'nip'  => 'nullable|string|unique:teachers,nip,' . $teacherId . ',public_id',
        ]);

        $teacher = $this->teacherService->update($teacherId, $data);
        abort_if(!$teacher, 404, 'Guru tidak ditemukan.');

        return response()->json([
            'message' => 'Data guru berhasil diperbarui.',
            'teacher' => $teacher,
        ]);
    }

    /** DELETE /teachers/{teacher} */
    public function destroy($teacherId)
    {
        $deleted = $this->teacherService->delete($teacherId);
        abort_if(!$deleted, 404, 'Guru tidak ditemukan.');

        return response()->json(['message' => 'Guru berhasil dihapus.']);
    }

    /** POST /teachers/{teacher}/attach-user  — create a new login account and attach it to an import-only teacher */
    public function attachUser(Request $request, $teacherId)
    {
        $data = $request->validate([
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        try {
            $result = $this->teacherService->attachUser($teacherId, $data['email'], $data['password']);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Akun login berhasil dibuat dan dihubungkan ke guru.',
            'data'    => $result,
        ]);
    }

    /** GET /teachers/users/search?email=xxx  — search existing users by email for relinking */
    public function searchUsers(Request $request)
    {
        $email = trim($request->query('email', ''));
        if (strlen($email) < 2) {
            return response()->json(['data' => []]);
        }

        $users = \App\Models\User::where('email', 'like', '%' . $email . '%')
            ->limit(8)
            ->get(['id', 'email', 'name']);

        return response()->json(['data' => $users]);
    }

    /** POST /teachers/{teacher}/link-user  — link an existing user to a teacher */
    public function linkUser(Request $request, $teacherId)
    {
        $data = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
        ]);

        try {
            $result = $this->teacherService->linkExistingUser($teacherId, $data['user_id']);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Akun berhasil dihubungkan ke guru.',
            'data'    => $result,
        ]);
    }

    /** GET /teachers/{teacher}/assignments */
    public function indexAssignments(Request $request, $teacherId)
    {
        $academicYearId = $request->query('academic_year_id');

        $assignments = $this->teacherService->getAssignments($teacherId, $academicYearId);
        abort_if($assignments === null, 404, 'Guru tidak ditemukan.');

        $teacher = \App\Models\Teacher::where('public_id', $teacherId)->with('guruWaliStudents.academicYear')->first();
        if ($teacher) {
            $query = collect($teacher->guruWaliStudents);
            if ($academicYearId) {
                $query = $query->where('academic_year_id', $academicYearId);
            }
            $guruWaliYears = $query->unique('academic_year_id');
            foreach ($guruWaliYears as $student) {
                $assignments->push((object)[
                    'id' => 'gw_' . $student->academic_year_id,
                    'assignment_type' => 'guru_wali',
                    'academic_year_id' => $student->academic_year_id,
                    'academic_year' => $student->academicYear,
                ]);
            }
        }

        return response()->json(['data' => $assignments]);
    }

    /** POST /teachers/{teacher}/assignments */
    public function storeAssignment(Request $request, $teacherId)
    {
        $data = $request->validate([
            'classroom_id'     => 'required|string|exists:classrooms,public_id',
            'academic_year_id' => 'required|integer|exists:academic_years,id',
            'assignment_type'  => 'required|in:wali_kelas,guru_bk,guru_mapel',
            'subject'          => 'nullable|string|max:100',
        ]);

        try {
            $assignment = $this->teacherService->addAssignment($teacherId, $data);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        abort_if(!$assignment, 404, 'Guru atau kelas tidak ditemukan.');

        return response()->json([
            'message'    => 'Penugasan berhasil ditambahkan.',
            'assignment' => $assignment->load(['classroom', 'academicYear']),
        ], 201);
    }

    /** DELETE /teachers/{teacher}/assignments/{assignment} */
    public function destroyAssignment($teacherId, $assignmentId)
    {
        $deleted = $this->teacherService->removeAssignment($teacherId, (int) $assignmentId);
        abort_if(!$deleted, 404, 'Penugasan tidak ditemukan.');

        return response()->json(['message' => 'Penugasan berhasil dihapus.']);
    }
}
