<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\TenantSetting;
use App\Repositories\AttendanceTokenRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AttendanceTokenController extends Controller
{
    public function __construct(
        private AttendanceTokenRepository $attendanceTokenRepo
    ) {}

    public function getToken(Request $request)
    {
        $kioskToken = $request->header('x-kiosk-token');
        if (! $kioskToken) {
            Log::error('Missing kiosk token. Headers: '.json_encode($request->headers->all()));

            return response()->json(['message' => 'Unauthorized Kiosk', 'received_headers' => $request->headers->all()], 401);
        }

        $tenantSetting = TenantSetting::where('key', 'kiosk_token')->where('value', $kioskToken)->first();
        if (! $tenantSetting) {
            return response()->json(['message' => 'Invalid Kiosk Token'], 401);
        }

        // Clean up old tokens occasionally
        $this->attendanceTokenRepo->removeOldTokens();

        $token = $this->attendanceTokenRepo->generateToken();
        $token->tenant_id = $tenantSetting->tenant_id;
        $token->save();

        $inactivityTimeout = (int) TenantSetting::getValue($tenantSetting->tenant_id, 'attendance', 'kiosk_inactivity_timeout_minutes', 20);
        $schoolStartTime = TenantSetting::getValue($tenantSetting->tenant_id, 'attendance', 'school_start_time', '07:00');
        $schoolEndTime = TenantSetting::getValue($tenantSetting->tenant_id, 'attendance', 'school_end_time', '14:00');

        return response()->json([
            'token' => $token->token,
            'expires_at' => $token->expires_at,
            'settings' => [
                'inactivity_timeout_minutes' => $inactivityTimeout,
                'school_start_time' => $schoolStartTime,
                'school_end_time' => $schoolEndTime,
            ],
        ]);
    }

    public function refresh(Request $request)
    {
        return $this->getToken($request);
    }

    public function validateToken(Request $request)
    {
        $kioskToken = $request->header('x-kiosk-token');
        if (! $kioskToken) {
            return response()->json(['valid' => false, 'message' => 'Missing kiosk token'], 401);
        }

        $tenantSetting = TenantSetting::where('key', 'kiosk_token')->where('value', $kioskToken)->first();
        if (! $tenantSetting) {
            return response()->json(['valid' => false, 'message' => 'Invalid kiosk token'], 401);
        }

        $inactivityTimeout = (int) TenantSetting::getValue(
            $tenantSetting->tenant_id,
            'attendance',
            'kiosk_inactivity_timeout_minutes',
            20
        );

        $schoolStartTime = TenantSetting::getValue($tenantSetting->tenant_id, 'attendance', 'school_start_time', '07:00');
        $schoolEndTime = TenantSetting::getValue($tenantSetting->tenant_id, 'attendance', 'school_end_time', '14:00');

        return response()->json([
            'valid' => true,
            'tenant_id' => $tenantSetting->tenant_id,
            'inactivity_timeout_minutes' => $inactivityTimeout,
            'school_start_time' => $schoolStartTime,
            'school_end_time' => $schoolEndTime,
        ], 200);
    }

    public function getStudents(Request $request)
    {
        $kioskToken = $request->header('x-kiosk-token');
        if (! $kioskToken) {
            return response()->json(['message' => 'Unauthorized Kiosk'], 401);
        }

        $tenantSetting = TenantSetting::where('key', 'kiosk_token')->where('value', $kioskToken)->first();
        if (! $tenantSetting) {
            return response()->json(['message' => 'Invalid Kiosk Token'], 401);
        }

        $students = \App\Models\Student::where('tenant_id', $tenantSetting->tenant_id)
            ->get(['id', 'public_id', 'name', 'nisn', 'nfc_uid'])
            ->makeVisible(['id']);

        return response()->json(['data' => $students]);
    }
}
