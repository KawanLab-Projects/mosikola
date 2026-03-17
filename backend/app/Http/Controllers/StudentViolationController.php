<?php

namespace App\Http\Controllers;

use App\Models\StudentViolation;
use Illuminate\Http\Request;

class StudentViolationController extends Controller
{
    private function getTenantId(Request $request)
    {
        $tenantUser = $request->user()->tenantUsers()->where('is_active', true)->first();
        abort_if(! $tenantUser, 403, 'Akses ditolak.');

        return $tenantUser->tenant_id;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $tenantId = $this->getTenantId($request);
        $violations = StudentViolation::with(['student', 'violation', 'recordedBy'])
            ->where('tenant_id', $tenantId)
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $violations,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $tenantId = $this->getTenantId($request);
        $userId = $request->user()->id;

        $validated = $request->validate([
            'student_id' => 'required', // This is actually the public_id from the frontend
            'violation_id' => 'required|exists:violations,id',
            'date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        // Resolve student by public_id or fallback to id (in case older versions used id)
        $studentQuery = \App\Models\Student::query();
        if (\Illuminate\Support\Str::isUuid($validated['student_id'])) {
            $studentQuery->where('public_id', $validated['student_id']);
        } else {
            $studentQuery->where('id', $validated['student_id']);
        }
        $student = $studentQuery->first();

        if (! $student) {
            return response()->json(['message' => 'Siswa tidak ditemukan.'], 404);
        }

        // Further validate that standard models belong to this tenant
        if ($student->tenant_id !== $tenantId) {
            return response()->json(['message' => 'Siswa tidak ditemukan dalam sekolah Anda.'], 403);
        }

        $violationRecord = StudentViolation::create([
            'tenant_id' => $tenantId,
            'student_id' => $student->id, // Use the resolved internal ID
            'violation_id' => $validated['violation_id'],
            'date' => $validated['date'],
            'notes' => $validated['notes'] ?? null,
            'recorded_by_user_id' => $userId,
        ]);

        // Load relationships for optimal default display return
        $violationRecord->load(['student', 'violation', 'recordedBy']);

        return response()->json([
            'message' => 'Catatan pelanggaran berhasil disimpan.',
            'data' => $violationRecord,
        ], 201);
    }

    /**
     * Store bulk newly created resources in storage.
     */
    public function bulkStore(Request $request)
    {
        $tenantId = $this->getTenantId($request);
        $userId = $request->user()->id;

        $validated = $request->validate([
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'required', // public_id or id
            'violation_id' => 'required|exists:violations,id',
            'date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $uuids = [];
        $ids = [];
        foreach ($validated['student_ids'] as $id) {
            if (\Illuminate\Support\Str::isUuid($id)) {
                $uuids[] = $id;
            } else {
                $ids[] = $id;
            }
        }

        $students = \App\Models\Student::where(function ($query) use ($uuids, $ids) {
            if (count($uuids) > 0) {
                $query->whereIn('public_id', $uuids);
            }
            if (count($ids) > 0) {
                $query->orWhereIn('id', $ids);
            }
        })->get();

        if ($students->isEmpty()) {
            return response()->json(['message' => 'Tidak ada siswa yang ditemukan.'], 404);
        }

        $insertedCount = 0;
        $records = [];
        $now = now();

        foreach ($students as $student) {
            if ($student->tenant_id === $tenantId) {
                $records[] = [
                    'tenant_id' => $tenantId,
                    'student_id' => $student->id,
                    'violation_id' => $validated['violation_id'],
                    'date' => $validated['date'],
                    'notes' => $validated['notes'] ?? null,
                    'recorded_by_user_id' => $userId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
                $insertedCount++;
            }
        }

        if ($insertedCount > 0) {
            StudentViolation::insert($records);

            return response()->json([
                'message' => "Berhasil mencatat $insertedCount pelanggaran.",
            ], 201);
        }

        return response()->json(['message' => 'Gagal mencatat pelanggaran karena error hak akses.'], 403);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, StudentViolation $studentViolation)
    {
        $tenantId = $this->getTenantId($request);

        if ($studentViolation->tenant_id !== $tenantId) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $studentViolation->delete();

        return response()->json([
            'message' => 'Catatan pelanggaran berhasil dihapus.',
        ]);
    }
}
