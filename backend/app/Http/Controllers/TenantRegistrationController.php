<?php

namespace App\Http\Controllers;

use App\Services\TenantRegistrationService;
use Illuminate\Http\Request;
use Exception;

class TenantRegistrationController extends Controller
{
    public function __construct(
        private TenantRegistrationService $registrationService
    ) {}

    public function register(Request $request)
    {
        $request->validate([
            'school_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'pic_name' => 'required|string|max:255',
            'whatsapp' => 'required|string|max:20',
            'slug' => 'required|string|max:100',
        ]);

        try {
            $registration = $this->registrationService->registerSchool($request->all());

            return response()->json([
                'message' => 'Pendaftaran berhasil. Silakan tunggu konfirmasi melalui email atau WhatsApp.',
                'data' => $registration
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 422);
        }
    }

    public function index()
    {
        return response()->json([
            'data' => $this->registrationService->listRegistrations()
        ]);
    }

    public function approve($id)
    {
        try {
            $registration = $this->registrationService->approveRegistration($id);
            return response()->json([
                'message' => 'Pendaftaran berhasil disetujui.',
                'data' => $registration
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 422);
        }
    }
}
