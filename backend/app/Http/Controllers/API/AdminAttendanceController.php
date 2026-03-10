<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Illuminate\Http\Request;

class AdminAttendanceController extends Controller
{
    private function getTenantId(Request $request)
    {
        $tenantUser = $request->user()->tenantUsers()->where('is_active', true)->first();
        abort_if(!$tenantUser, 403, 'Akses ditolak.');
        return $tenantUser->tenant_id;
    }

    public function index(Request $request)
    {
        $tenantId = $this->getTenantId($request);
        $date = $request->query('date', now()->toDateString());
        $classroomId = $request->query('classroom_id');

        $query = Attendance::with(['student.classroom'])
            ->where('tenant_id', $tenantId)
            ->whereDate('attendance_date', $date);

        if ($classroomId) {
            $query->whereHas('student.classroom', function ($q) use ($classroomId) {
                $q->where('public_id', $classroomId);
            });
        }

        $attendances = $query->orderBy('attended_at', 'desc')->get();

        return response()->json([
            'data' => $attendances
        ]);
    }
}
