<?php

namespace App\Http\Controllers;

use App\Models\StudentPositiveBehavior;
use Illuminate\Http\Request;

class StudentPositiveBehaviorController extends Controller
{
    private function getTenantId(Request $request)
    {
        $tenantUser = $request->user()->tenantUsers()->where('is_active', true)->first();
        abort_if(! $tenantUser, 403, 'Akses ditolak.');

        return $tenantUser->tenant_id;
    }

    public function index(Request $request)
    {
        $tenantId = $this->getTenantId($request);
        $records = StudentPositiveBehavior::with(['student', 'positiveBehavior', 'recordedBy'])
            ->where('tenant_id', $tenantId)
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $records]);
    }

    public function store(Request $request)
    {
        $tenantId = $this->getTenantId($request);
        $userId = $request->user()->id;

        $validated = $request->validate([
            'student_id' => 'required',
            'positive_behavior_id' => 'required|exists:positive_behaviors,id',
            'date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

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

        if ($student->tenant_id !== $tenantId) {
            return response()->json(['message' => 'Siswa tidak ditemukan dalam sekolah Anda.'], 403);
        }

        $record = StudentPositiveBehavior::create([
            'tenant_id' => $tenantId,
            'student_id' => $student->id,
            'positive_behavior_id' => $validated['positive_behavior_id'],
            'date' => $validated['date'],
            'notes' => $validated['notes'] ?? null,
            'recorded_by_user_id' => $userId,
        ]);

        $record->load(['student', 'positiveBehavior', 'recordedBy']);

        return response()->json([
            'message' => 'Catatan perilaku positif berhasil disimpan.',
            'data' => $record,
        ], 201);
    }

    public function bulkStore(Request $request)
    {
        $tenantId = $this->getTenantId($request);
        $userId = $request->user()->id;

        $validated = $request->validate([
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'required',
            'positive_behavior_id' => 'required|exists:positive_behaviors,id',
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
                    'positive_behavior_id' => $validated['positive_behavior_id'],
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
            StudentPositiveBehavior::insert($records);

            return response()->json(['message' => "Berhasil mencatat $insertedCount perilaku positif."], 201);
        }

        return response()->json(['message' => 'Gagal mencatat perilaku positif karena error hak akses.'], 403);
    }

    public function destroy(Request $request, StudentPositiveBehavior $studentPositiveBehavior)
    {
        $tenantId = $this->getTenantId($request);

        if ($studentPositiveBehavior->tenant_id !== $tenantId) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $studentPositiveBehavior->delete();

        return response()->json(['message' => 'Catatan perilaku positif berhasil dihapus.']);
    }
}
