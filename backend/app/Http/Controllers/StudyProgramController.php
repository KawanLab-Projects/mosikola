<?php

namespace App\Http\Controllers;

use App\Services\StudyProgramService;
use Illuminate\Http\Request;

class StudyProgramController extends Controller
{
    public function __construct(protected StudyProgramService $service) {}

    private function resolveTenantId(Request $request): int
    {
        $tenantUser = $request->user()->tenantUsers()->where('is_active', true)->first();
        abort_if(!$tenantUser, 403, 'Akses ditolak.');
        return $tenantUser->tenant_id;
    }

    /** GET /study-programs — scoped to the authenticated tenant */
    public function index(Request $request)
    {
        return response()->json([
            'data' => $this->service->getByTenant($this->resolveTenantId($request)),
        ]);
    }

    /** POST /study-programs */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:255',
            'short' => 'required|string|max:50',
        ]);

        $validated['tenant_id'] = $this->resolveTenantId($request);

        return response()->json([
            'data'    => $this->service->store($validated),
            'message' => 'Jurusan berhasil ditambahkan.',
        ], 201);
    }

    /** POST /study-programs/bulk */
    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'items'         => 'required|array|min:1',
            'items.*.name'  => 'required|string|max:255',
            'items.*.short' => 'required|string|max:50',
        ]);

        $tenantId = $this->resolveTenantId($request);
        $data = array_map(function ($item) use ($tenantId) {
            return array_merge($item, [
                'tenant_id'  => $tenantId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }, $validated['items']);

        $this->service->storeMany($data);

        return response()->json([
            'message' => 'Banyak jurusan berhasil ditambahkan.',
        ], 201);
    }

    public function show($public_id)
    {
        $studyProgram = $this->service->getByPublicId($public_id);
        if (!$studyProgram) {
            return response()->json(['message' => 'Jurusan tidak ditemukan.'], 404);
        }
        return response()->json(['data' => $studyProgram]);
    }

    public function update(Request $request, $public_id)
    {
        $validated = $request->validate([
            'name'  => 'sometimes|required|string|max:255',
            'short' => 'sometimes|required|string|max:50',
        ]);

        $updated = $this->service->update($public_id, $validated);
        if (!$updated) {
            return response()->json(['message' => 'Jurusan tidak ditemukan.'], 404);
        }
        return response()->json(['message' => 'Jurusan berhasil diperbarui.']);
    }

    public function destroy($public_id)
    {
        $deleted = $this->service->delete($public_id);
        if (!$deleted) {
            return response()->json(['message' => 'Jurusan tidak ditemukan.'], 404);
        }
        return response()->json(['message' => 'Jurusan berhasil dihapus.']);
    }
}
