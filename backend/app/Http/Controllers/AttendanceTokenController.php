<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\AttendanceTokenService;

class AttendanceTokenController extends Controller
{
    public function __construct(private AttendanceTokenService $attendanceTokenService)
    {}

    public function getToken() 
    {
        $token = $this->attendanceTokenService->getToken();
        
        return response()->json([
            'data' => $token
        ]);
    }
}
