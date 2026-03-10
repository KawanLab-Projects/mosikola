<?php

namespace App\Http\Controllers;

use App\Services\LessonJournalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LessonJournalController extends Controller
{
    public function __construct(private LessonJournalService $service) {}

    // ── GET /api/teacher/schedules ────────────────────────────────────────

    public function teacherSchedules(Request $request): JsonResponse
    {
        $teacher = $this->service->resolveTeacher($request->user()->id);
        abort_if(!$teacher, 403, 'Akun ini tidak terhubung ke data guru.');

        $schedules = $this->service->getTeacherSchedules(
            $teacher->id,
            $request->integer('academic_year_id') ?: null
        );

        return response()->json(['success' => true, 'data' => $schedules]);
    }

    // ── GET /api/lesson-journals/by-schedule/{scheduleId}?date= ──────────

    public function bySchedule(Request $request, int $scheduleId): JsonResponse
    {
        $request->validate(['date' => 'required|date_format:Y-m-d']);

        $journal = $this->service->getJournalByScheduleAndDate($scheduleId, $request->date);

        return response()->json(['success' => true, 'data' => $journal]);
    }

    // ── POST /api/lesson-journals ──────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $teacher = $this->service->resolveTeacher($request->user()->id);
        abort_if(!$teacher, 403, 'Akun ini tidak terhubung ke data guru.');

        $data = $request->validate([
            'schedule_id' => 'required|integer|exists:schedules,id',
            'date'        => 'required|date_format:Y-m-d',
            'room'        => 'nullable|string|max:100',
            'topic'       => 'nullable|string|max:500',
            'notes'       => 'nullable|string',
            'homework'    => 'nullable|string',
        ]);

        $journal = $this->service->createJournal($teacher->id, $data);

        return response()->json(['success' => true, 'data' => $journal], 201);
    }

    // ── PUT /api/lesson-journals/{id} ─────────────────────────────────────

    public function update(Request $request, int $id): JsonResponse
    {
        $teacher = $this->service->resolveTeacher($request->user()->id);
        abort_if(!$teacher, 403, 'Akun ini tidak terhubung ke data guru.');

        $data = $request->validate([
            'room'     => 'nullable|string|max:100',
            'topic'    => 'nullable|string|max:500',
            'notes'    => 'nullable|string',
            'homework' => 'nullable|string',
        ]);

        $journal = $this->service->updateJournal($teacher->id, $id, $data);

        return response()->json(['success' => true, 'data' => $journal]);
    }

    // ── GET /api/lesson-journals/{journalId}/attendances ─────────────────

    public function attendances(int $journalId): JsonResponse
    {
        $result = $this->service->getAttendances($journalId);

        return response()->json(['success' => true, 'data' => $result]);
    }

    // ── POST /api/lesson-journals/{journalId}/attendances ─────────────────

    public function storeAttendances(Request $request, int $journalId): JsonResponse
    {
        $teacher = $this->service->resolveTeacher($request->user()->id);
        abort_if(!$teacher, 403, 'Akun ini tidak terhubung ke data guru.');

        $request->validate([
            'attendances'              => 'required|array',
            'attendances.*.student_id' => 'required|integer|exists:students,id',
            'attendances.*.status'     => 'required|in:hadir,sakit,izin,alpha',
            'attendances.*.notes'      => 'nullable|string',
        ]);

        $this->service->saveAttendances($teacher->id, $journalId, $request->attendances);

        return response()->json(['success' => true, 'message' => 'Absensi berhasil disimpan.']);
    }
}
