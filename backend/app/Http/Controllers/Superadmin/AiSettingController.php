<?php

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\GlobalSetting;
use Illuminate\Support\Facades\Http;
use Exception;

class AiSettingController extends Controller
{
    /**
     * Get all AI global settings.
     */
    public function index()
    {
        $settings = GlobalSetting::whereIn('key', ['ai_provider', 'ai_model', 'ai_api_key'])->get();
        return response()->json([
            'status' => 'success',
            'data' => $settings->pluck('value', 'key'),
        ]);
    }

    /**
     * Update AI settings
     */
    public function update(Request $request)
    {
        $data = $request->validate([
            'ai_provider' => 'required|string|in:gemini,openai',
            'ai_model' => 'required|string',
            'ai_api_key' => 'required|string',
        ]);

        foreach ($data as $key => $value) {
            GlobalSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Pengaturan AI Provider berhasil disimpan.',
        ]);
    }

    /**
     * Test a specific AI connection.
     */
    public function testConnection(Request $request)
    {
        $request->validate([
            'ai_provider' => 'required|string|in:gemini,openai',
            'ai_model' => 'required|string',
            'ai_api_key' => 'required|string',
        ]);

        $provider = $request->ai_provider;
        $model = $request->ai_model;
        $apiKey = $request->ai_api_key;

        try {
            if ($provider === 'gemini') {
                $response = Http::withoutVerifying()->timeout(10)->withHeaders([
                    'Content-Type' => 'application/json',
                ])->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                    'contents' => [
                        ['parts' => [['text' => 'Hello. Reply with OK if you understand.']]]
                    ]
                ]);

                if ($response->successful()) {
                    return response()->json([
                        'status' => 'success',
                        'message' => 'Koneksi ke Gemini API berhasil (Status: 200).',
                    ]);
                } else {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Gemini API merespons dengan error (Status: ' . $response->status() . '). Periksa kembali API Key dan nama Model yang digunakan.',
                        'details' => $response->json()
                    ], 400);
                }
            } elseif ($provider === 'openai') {
                $response = Http::withoutVerifying()->timeout(10)->withHeaders([
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                ])->post('https://api.openai.com/v1/chat/completions', [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'user', 'content' => 'Hello. Reply with OK if you understand.']
                    ],
                    'max_tokens' => 10,
                ]);

                if ($response->successful()) {
                    return response()->json([
                        'status' => 'success',
                        'message' => 'Koneksi ke OpenAI API berhasil (Status: 200).',
                    ]);
                } else {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'OpenAI API merespons dengan error (Status: ' . $response->status() . '). Periksa kembali API Key dan nama Model yang digunakan.',
                        'details' => $response->json()
                    ], 400);
                }
            }

            return response()->json(['message' => 'Provider tidak didukung.'], 400);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal terhubung ke server LLM: ' . $e->getMessage(),
            ], 500);
        }
    }
}
