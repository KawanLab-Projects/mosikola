<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Services\AttendanceService;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function __construct(private AttendanceService $attendanceService) {}

    public function recordAttendance(Request $request)
    {
        $request->validate([
            'attendance_token' => 'required|string',
        ]);

        $user = $request->user();
        $attendanceToken = $request->attendance_token;

        $tokenRecord = \App\Models\AttendanceToken::where('token', $attendanceToken)
            ->where('expires_at', '>', now())
            ->first();

        if (! $tokenRecord) {
            return response()->json(['message' => 'Invalid or expired Attendance Token'], 422);
        }

        $record = $this->attendanceService->processStudentQrScan($user, $attendanceToken, $tokenRecord->tenant_id);

        if (isset($record['status']) && $record['status'] === 'error') {
            return response()->json($record, 422);
        }

        return response()->json([
            'data' => $record,
        ]);
    }

    public function getLateArrivals(Request $request)
    {
        $date = $request->get('date', today()->toDateString());
        $limitTime = $request->get('limit_time', '07:30');

        $result = $this->attendanceService
            ->getLateArrival($date, $limitTime);

        return response()->json($result);
    }

    public function getStudentAttendances(string $parentPhone)
    {
        $result = $this->attendanceService->getStudentAttendances($parentPhone);
        // $result = Student::where('parent_phone', '08537024')->get();

        return response()->json($result);
    }

    public function getAttendanceHistory(Request $request)
    {
        $result = $this->attendanceService->getAttendanceHistory($request->user());

        return response()->json($result);
    }
}
