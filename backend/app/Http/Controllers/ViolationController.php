<?php

namespace App\Http\Controllers;

use App\Models\Violation;
use App\Services\ViolationService;
use Illuminate\Http\Request;

class ViolationController extends Controller
{
    public function __construct(private ViolationService $service) {}

    private function resolveTenantId(Request $request): int
    {
        $tenantUser = $request->user()->tenantUsers()->where('is_active', true)->first();
        abort_if(!$tenantUser, 403, 'Akses ditolak.');
        return $tenantUser->tenant_id;
    }

    /** GET /violations */
    public function index(Request $request)
    {
        return response()->json([
            'data' => $this->service->getAll($this->resolveTenantId($request)),
        ]);
    }

    /** POST /violations */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'   => 'required|string|max:255',
            'points' => 'required|integer|min:0',
        ]);

        $violation = $this->service->create($this->resolveTenantId($request), $validated);

        return response()->json([
            'message' => 'Jenis pelanggaran berhasil ditambahkan.',
            'data'    => $violation,
        ], 201);
    }

    /** GET /violations/{violation} */
    public function show(Request $request, Violation $violation)
    {
        $this->service->findOrFail403($violation->id, $this->resolveTenantId($request));

        return response()->json(['data' => $violation]);
    }

    /** PUT/PATCH /violations/{violation} */
    public function update(Request $request, Violation $violation)
    {
        $tenantId = $this->resolveTenantId($request);

        $validated = $request->validate([
            'name'   => 'sometimes|string|max:255',
            'points' => 'sometimes|integer|min:0',
        ]);

        $violation = $this->service->findOrFail403($violation->id, $tenantId);
        $updated   = $this->service->update($violation, $validated);

        return response()->json([
            'message' => 'Jenis pelanggaran berhasil diperbarui.',
            'data'    => $updated,
        ]);
    }

    /** DELETE /violations/{violation} */
    public function destroy(Request $request, Violation $violation)
    {
        $violation = $this->service->findOrFail403($violation->id, $this->resolveTenantId($request));

        $this->service->delete($violation);

        return response()->json(['message' => 'Jenis pelanggaran berhasil dihapus.']);
    }
}
