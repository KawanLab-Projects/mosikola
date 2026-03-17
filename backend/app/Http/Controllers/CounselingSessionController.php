<?php

namespace App\Http\Controllers;

use App\Services\CounselingSessionService;
use Illuminate\Http\Request;

class CounselingSessionController extends Controller
{
    protected $service;

    public function __construct(CounselingSessionService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 15);
        $sessions = $this->service->getSessionsForTeacher($request->user(), $perPage);

        return response()->json($sessions);
    }

    public function store(Request $request)
    {
        // Simple validation in controller to ensure request is valid before hitting service
        $validated = $request->validate([
            'student_id' => 'required',
            'counseling_date' => 'required|date',
            'topic' => 'required|string|max:255',
            'notes' => 'nullable|string',
            'status' => 'required|in:open,resolved,follow_up_needed',
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

        $validated['student_id'] = $student->id;

        // Inject teacher_id from authenticated user
        if ($request->user() && $request->user()->teacher) {
            $validated['teacher_id'] = $request->user()->teacher->id;
        } else {
            return response()->json(['message' => 'User is not a teacher'], 403);
        }

        $session = $this->service->createSession($validated);

        return response()->json(['data' => $session], 201);
    }

    public function show($id)
    {
        $session = $this->service->getSession($id);

        return response()->json(['data' => $session]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'counseling_date' => 'sometimes|required|date',
            'topic' => 'sometimes|required|string|max:255',
            'notes' => 'nullable|string',
            'status' => 'sometimes|required|in:open,resolved,follow_up_needed',
        ]);

        $session = $this->service->updateSession($id, $validated);

        return response()->json(['data' => $session]);
    }

    public function destroy($id)
    {
        $this->service->deleteSession($id);

        return response()->json(null, 204);
    }
}
