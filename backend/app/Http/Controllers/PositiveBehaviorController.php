<?php

namespace App\Http\Controllers;

use App\Models\PositiveBehavior;
use Illuminate\Http\Request;

class PositiveBehaviorController extends Controller
{
    private function resolveTenantId(Request $request): int
    {
        $tenantUser = $request->user()->tenantUsers()->where('is_active', true)->first();
        abort_if(!$tenantUser, 403, 'Akses ditolak.');
        return $tenantUser->tenant_id;
    }

    public function index(Request $request)
    {
        $tenantId = $this->resolveTenantId($request);
        $behaviors = PositiveBehavior::where('tenant_id', $tenantId)->get();
        return response()->json(['data' => $behaviors]);
    }

    public function store(Request $request)
    {
        $tenantId = $this->resolveTenantId($request);

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'point_value' => 'required|integer|min:0',
        ]);

        $behavior = PositiveBehavior::create([
            'tenant_id'   => $tenantId,
            'name'        => $validated['name'],
            'point_value' => $validated['point_value'],
        ]);

        return response()->json([
            'message' => 'Perilaku positif berhasil ditambahkan.',
            'data'    => $behavior,
        ], 201);
    }

    public function show(Request $request, PositiveBehavior $positiveBehavior)
    {
        if ($positiveBehavior->tenant_id !== $this->resolveTenantId($request)) abort(403);
        return response()->json(['data' => $positiveBehavior]);
    }

    public function update(Request $request, PositiveBehavior $positiveBehavior)
    {
        if ($positiveBehavior->tenant_id !== $this->resolveTenantId($request)) abort(403);

        $validated = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'point_value' => 'sometimes|integer|min:0',
        ]);

        $positiveBehavior->update($validated);

        return response()->json([
            'message' => 'Perilaku positif berhasil diperbarui.',
            'data'    => $positiveBehavior,
        ]);
    }

    public function destroy(Request $request, PositiveBehavior $positiveBehavior)
    {
        if ($positiveBehavior->tenant_id !== $this->resolveTenantId($request)) abort(403);
        $positiveBehavior->delete();
        return response()->json(['message' => 'Perilaku positif berhasil dihapus.']);
    }
}
