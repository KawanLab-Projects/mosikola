<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\LessonJournal;
use App\Models\TeacherAssignment;
use Illuminate\Http\Request;

class TeacherHomeroomController extends Controller
{
    private function getHomeroomClass(Request $request)
    {
        $teacher = $request->user()->teacher;
        return $teacher ? TeacherAssignment::where('teacher_id', $teacher->id)
            ->where('assignment_type', 'wali_kelas')
            ->first() : null;
    }

    public function getGeneralAttendance(Request $request)
    {
        $homeroom = $this->getHomeroomClass($request);

        if (!$homeroom || !$homeroom->classroom_id) {
            return response()->json(['message' => 'Anda bukan wali kelas.'], 403);
        }

        $date = $request->query('date', now()->toDateString());

        $attendances = Attendance::with(['student.classroom'])
            ->whereHas('student', function ($query) use ($homeroom) {
                $query->where('classroom_id', $homeroom->classroom_id);
            })
            ->whereDate('attendance_date', $date)
            ->orderBy('attended_at', 'desc')
            ->get();

        return response()->json([
            'data' => $attendances
        ]);
    }

    public function getJournalAttendance(Request $request)
    {
        $homeroom = $this->getHomeroomClass($request);

        if (!$homeroom || !$homeroom->classroom_id) {
            return response()->json(['message' => 'Anda bukan wali kelas.'], 403);
        }

        $date = $request->query('date', now()->toDateString());

        $journals = LessonJournal::with(['attendances', 'schedule.subject', 'schedule.teacher'])
            ->whereHas('schedule', function ($query) use ($homeroom) {
                $query->where('classroom_id', $homeroom->classroom_id);
            })
            ->whereDate('date', $date)
            ->get()
            ->map(function ($journal) {
                return [
                    'id' => $journal->id,
                    'topic' => $journal->topic,
                    'notes' => $journal->notes,
                    'filled_at' => $journal->filled_at,
                    'status' => $journal->status,
                    'subject' => [
                        'name' => $journal->schedule->subject->name ?? 'Unknown'
                    ],
                    'teacher' => [
                        'name' => $journal->schedule->teacher->name ?? 'Unknown'
                    ],
                    'attendance_summary' => [
                        'hadir' => $journal->attendances->where('status', 'hadir')->count(),
                        'sakit' => $journal->attendances->where('status', 'sakit')->count(),
                        'izin' => $journal->attendances->where('status', 'izin')->count(),
                        'alpha' => $journal->attendances->where('status', 'alpha')->count(),
                    ]
                ];
            });

        return response()->json([
            'data' => $journals
        ]);
    }
}
