<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\TenantSetting;
use App\Services\AttendanceService;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function __construct(
        private AttendanceService $attendanceService
    ) {}

    public function qr(Request $request)
    {
        $request->validate([
            'qr_token' => 'required|string',
        ]);

        $tokenRecord = \App\Models\AttendanceToken::where('token', $request->qr_token)
            ->where('expires_at', '>', now())
            ->first();

        if (!$tokenRecord) {
            return response()->json(['message' => 'Invalid or expired QR Token'], 422);
        }

        $result = $this->attendanceService->processStudentQrScan($request->user(), $request->qr_token, $tokenRecord->tenant_id);

        if (isset($result['status']) && $result['status'] === 'error') {
            return response()->json($result, 422);
        }

        return response()->json($result);
    }

    public function nfc(Request $request)
    {
        $request->validate([
            'nfc_uid' => 'required|string',
        ]);

        $kioskToken = $request->header('x-kiosk-token');
        if (!$kioskToken) {
            return response()->json(['message' => 'Unauthorized Kiosk'], 401);
        }

        // Find tenant via kiosk token
        $tenantSetting = TenantSetting::where('key', 'kiosk_token')->where('value', $kioskToken)->first();
        if (!$tenantSetting) {
            return response()->json(['message' => 'Invalid Kiosk Token'], 401);
        }

        $result = $this->attendanceService->processNfcAttendance($request->nfc_uid, $tenantSetting->tenant_id);

        if (isset($result['status']) && $result['status'] === 'error') {
            return response()->json($result, 404);
        }

        if (isset($result['status']) && $result['status'] === 'warning') {
            return response()->json($result, 409); // Conflict - already checkout out
        }

        return response()->json($result);
    }

    public function cameraBarcode(Request $request)
    {
        $request->validate([
            'nisn' => 'required|string',
        ]);

        $kioskToken = $request->header('x-kiosk-token');
        if (!$kioskToken) {
            return response()->json(['message' => 'Unauthorized Kiosk'], 401);
        }

        // Find tenant via kiosk token
        $tenantSetting = TenantSetting::where('key', 'kiosk_token')
            ->where('value', $kioskToken)
            ->first();

        if (!$tenantSetting) {
            return response()->json(['message' => 'Invalid Kiosk Token'], 401);
        }

        $result = $this->attendanceService->processCameraNisnAttendance($request->nisn, $tenantSetting->tenant_id);

        if (isset($result['status']) && $result['status'] === 'error') {
            return response()->json($result, 404);
        }

        if (isset($result['status']) && $result['status'] === 'warning') {
            return response()->json($result, 409); // Conflict - already checked out
        }

        return response()->json($result);
    }

    public function batch(Request $request)
    {
        $request->validate([
            'records' => 'required|array',
            'records.*.student_id' => 'required|integer',
            'records.*.timestamp' => 'required|string',
            'records.*.method' => 'string',
        ]);

        $kioskToken = $request->header('x-kiosk-token');
        if (!$kioskToken) {
            return response()->json(['message' => 'Unauthorized Kiosk'], 401);
        }

        $tenantSetting = TenantSetting::where('key', 'kiosk_token')->where('value', $kioskToken)->first();
        if (!$tenantSetting) {
            return response()->json(['message' => 'Invalid Kiosk Token'], 401);
        }

        $results = $this->attendanceService->batchAttendance($request->records, $tenantSetting->tenant_id);

        return response()->json(['results' => $results]);
    }
}
