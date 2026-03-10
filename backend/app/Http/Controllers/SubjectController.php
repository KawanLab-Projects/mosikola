<?php

namespace App\Http\Controllers;

use App\Services\SubjectService;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function __construct(protected SubjectService $service) {}

    private function resolveTenantId(Request $request): int
    {
        $tenantUser = $request->user()->tenantUsers()->where('is_active', true)->first();
        abort_if(!$tenantUser, 403, 'Akses ditolak.');
        return $tenantUser->tenant_id;
    }

    /** GET /subjects */
    public function index(Request $request)
    {
        return response()->json([
            'data' => $this->service->getByTenant($this->resolveTenantId($request)),
        ]);
    }

    /** POST /subjects */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:20',
        ]);

        $validated['tenant_id'] = $this->resolveTenantId($request);

        return response()->json([
            'data'    => $this->service->store($validated),
            'message' => 'Mata pelajaran berhasil ditambahkan.',
        ], 201);
    }

    /** GET /subjects/{id} */
    public function show($public_id)
    {
        $subject = $this->service->getByPublicId($public_id);
        if (!$subject) {
            return response()->json(['message' => 'Mata pelajaran tidak ditemukan.'], 404);
        }
        return response()->json(['data' => $subject]);
    }

    /** PUT /subjects/{id} */
    public function update(Request $request, $public_id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => 'nullable|string|max:20',
        ]);

        $updated = $this->service->update($public_id, $validated);
        if (!$updated) {
            return response()->json(['message' => 'Mata pelajaran tidak ditemukan.'], 404);
        }
        return response()->json(['message' => 'Mata pelajaran berhasil diperbarui.']);
    }

    /** DELETE /subjects/{id} */
    public function destroy($public_id)
    {
        $deleted = $this->service->delete($public_id);
        if (!$deleted) {
            return response()->json(['message' => 'Mata pelajaran tidak ditemukan.'], 404);
        }
        return response()->json(['message' => 'Mata pelajaran berhasil dihapus.']);
    }
}
