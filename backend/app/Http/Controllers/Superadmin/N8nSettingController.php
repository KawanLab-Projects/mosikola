<?php

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\GlobalSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use Exception;

class N8nSettingController extends Controller
{
    /**
     * Get all n8n global settings.
     */
    public function index()
    {
        $settings = GlobalSetting::where('key', 'like', 'n8n_webhook_%')->get();
        return response()->json([
            'status' => 'success',
            'data' => $settings->pluck('value', 'key'),
        ]);
    }

    /**
     * Update n8n settings
     */
    public function update(Request $request)
    {
        $data = $request->validate([
            'n8n_webhook_teacher_reminder' => 'nullable|url',
            'n8n_webhook_student_late_homeroom' => 'nullable|url',
            'n8n_webhook_student_late_parent' => 'nullable|url',
            'n8n_webhook_student_growth' => 'nullable|url',
        ]);

        foreach ($data as $key => $value) {
            GlobalSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Pengaturan n8n berhasil disimpan.',
        ]);
    }

    /**
     * Test a specific webhook URL.
     */
    public function testWebhook(Request $request)
    {
        $request->validate([
            'url' => 'required|url',
        ]);

        try {
            // Send a dummy JSON payload
            $response = Http::timeout(5)->post($request->url, [
                'event' => 'test_connection',
                'message' => 'This is a test webhook from Mosikola Superadmin.',
                'timestamp' => now()->toIso8601String(),
            ]);

            if ($response->successful()) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Webhook berhasil dipanggil (Status: ' . $response->status() . ').',
                ]);
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Webhook merespons dengan error (Status: ' . $response->status() . ').',
            ], 400);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memanggil webhook: ' . $e->getMessage(),
            ], 500);
        }
    }
}
