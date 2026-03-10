<?php

namespace App\Http\Controllers;

use App\Services\CurriculumItemService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CurriculumItemController extends Controller
{
    public function __construct(private CurriculumItemService $service) {}

    private function resolveTenantId(Request $request): int
    {
        $tenantUser = $request->user()->tenantUsers()->where('is_active', true)->first();
        abort_if(!$tenantUser, 403, 'Akses ditolak.');
        return $tenantUser->tenant_id;
    }

    /** GET /curriculum-items?academic_year_id=X[&classroom_public_id=Y] */
    public function index(Request $request): JsonResponse
    {
        $request->validate(['academic_year_id' => 'required|integer']);

        $tenantId       = $this->resolveTenantId($request);
        $academicYearId = (int) $request->query('academic_year_id');
        $classroomId    = null;

        if ($request->query('classroom_id')) {
            $classroomId = (int) $request->query('classroom_id');
        } elseif ($request->query('classroom_public_id')) {
            $classroomId = \App\Models\Classroom::where('public_id', $request->query('classroom_public_id'))->value('id');
        }

        $items = $classroomId
            ? $this->service->getByYearAndClassroom($tenantId, $academicYearId, $classroomId)
            : $this->service->getByYear($tenantId, $academicYearId);

        return response()->json(['data' => $items]);
    }

    /** POST /curriculum-items */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'academic_year_id'    => 'required|integer|exists:academic_years,id',
            'classroom_public_id' => 'required|string|exists:classrooms,public_id',
            'subject_public_id'   => 'required|string|exists:subjects,public_id',
            'teacher_public_id'   => 'required|string|exists:teachers,public_id',
            'hours_per_week'      => 'required|integer|min:1|max:40',
        ]);

        $tenantId    = $this->resolveTenantId($request);
        $classroomId = \App\Models\Classroom::where('public_id', $request->classroom_public_id)->value('id');
        $subjectId   = \App\Models\Subject::where('public_id', $request->subject_public_id)->value('id');
        $teacherId   = \App\Models\Teacher::where('public_id', $request->teacher_public_id)->value('id');

        $item = $this->service->create($tenantId, $request->academic_year_id, [
            'classroom_id'   => $classroomId,
            'subject_id'     => $subjectId,
            'teacher_id'     => $teacherId,
            'hours_per_week' => $request->hours_per_week,
        ]);

        return response()->json(['message' => 'Kurikulum berhasil ditambahkan.', 'data' => $item], 201);
    }

    /** PUT /curriculum-items/{id} */
    public function update(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'teacher_public_id' => 'required|string|exists:teachers,public_id',
            'hours_per_week'    => 'required|integer|min:1|max:40',
        ]);

        $teacherId = \App\Models\Teacher::where('public_id', $request->teacher_public_id)->value('id');

        $updated = $this->service->update($id, [
            'teacher_id'     => $teacherId,
            'hours_per_week' => $request->hours_per_week,
        ]);
        abort_if(!$updated, 404, 'Data kurikulum tidak ditemukan.');

        return response()->json(['message' => 'Kurikulum berhasil diperbarui.']);
    }

    /** DELETE /curriculum-items/{id} */
    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->service->delete($id);
        abort_if(!$deleted, 404, 'Data kurikulum tidak ditemukan.');

        return response()->json(['message' => 'Kurikulum berhasil dihapus.']);
    }

    /** POST /curriculum-items/copy */
    public function copy(Request $request): JsonResponse
    {
        $request->validate([
            'academic_year_id'           => 'required|integer|exists:academic_years,id',
            'source_classroom_public_id' => 'required|string|exists:classrooms,public_id',
            'target_classroom_public_id' => 'required|string|exists:classrooms,public_id',
        ]);

        abort_if(
            $request->source_classroom_public_id === $request->target_classroom_public_id,
            422,
            'Kelas sumber dan tujuan tidak boleh sama.'
        );

        $tenantId          = $this->resolveTenantId($request);
        $sourceClassroomId = \App\Models\Classroom::where('public_id', $request->source_classroom_public_id)->value('id');
        $targetClassroomId = \App\Models\Classroom::where('public_id', $request->target_classroom_public_id)->value('id');

        $copiedCount = $this->service->copyFromClassroom($tenantId, $request->academic_year_id, $sourceClassroomId, $targetClassroomId);

        return response()->json([
            'message' => $copiedCount > 0
                ? "Berhasil menyalin {$copiedCount} mata pelajaran kurikulum."
                : 'Tidak ada data kurikulum baru yang disalin (mungkin sudah ada atau sumber kosong).',
            'copied_count' => $copiedCount
        ], 201);
    }
}
