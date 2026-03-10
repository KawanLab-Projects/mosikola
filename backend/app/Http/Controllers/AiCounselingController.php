<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\GlobalSetting;
use Illuminate\Support\Facades\Http;

class AiCounselingController extends Controller
{
    public function generateRecommendation(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required',
        ]);

        $user = $request->user();
        $tenantUser = $user->tenantUsers()->where('is_active', true)->with('tenant.activeSubscription.plan')->first();
        $plan = $tenantUser?->tenant?->activeSubscription?->plan;

        if (!$plan || !($plan->features['ai_counseling'] ?? false)) {
            return response()->json(['message' => 'Sekolah Anda belum mengaktifkan fitur AI Helper Bimbingan Konseling.'], 403);
        }

        $studentQuery = Student::with(['studentViolations.violation', 'classroom']);
        if (\Illuminate\Support\Str::isUuid($validated['student_id'])) {
            $studentQuery->where('public_id', $validated['student_id']);
        } else {
            $studentQuery->where('id', $validated['student_id']);
        }
        $student = $studentQuery->first();

        if (!$student) {
            return response()->json(['message' => 'Siswa tidak ditemukan.'], 404);
        }

        // Gather student context
        $violationsText = "";
        if ($student->studentViolations && $student->studentViolations->count() > 0) {
            foreach ($student->studentViolations as $violation) {
                // Ensure date formatting handles missing/invalid gracefully
                $dateStr = "-";
                if (isset($violation->date)) {
                    $dateStr = \Carbon\Carbon::parse($violation->date)->format('d-m-Y');
                }

                $violationsText .= "- {$dateStr}: {$violation->violation->name} ({$violation->violation->point} Poin)\n";
            }
        } else {
            $violationsText = "Belum ada catatan pelanggaran.\n";
        }

        $dbSettings = GlobalSetting::whereIn('key', ['ai_provider', 'ai_api_key', 'ai_model'])->pluck('value', 'key');

        $provider = $dbSettings['ai_provider'] ?? 'gemini';
        $apiKey = $dbSettings['ai_api_key'] ?? env('GEMINI_API_KEY');
        $model = $dbSettings['ai_model'] ?? 'gemini-2.5-flash';

        if (!$apiKey) {
            return response()->json([
                'message' => 'API Key LLM belum diatur di Pengaturan Sistem maupun di environment variables backend.'
            ], 500);
        }

        $prompt = "Tindaklanjuti data sisa berikut sebagai seorang Guru Bimbingan Konseling profesional. Berikan respon Anda dalam format Markdown.\n\n" .
            "Nama Siswa: {$student->name}\n\n" .
            "Daftar Pelanggaran Terakhir:\n{$violationsText}\n\n" .
            "Saya membutuhkan Anda untuk memberikan:\n" .
            "1. **Analisis Psikologis Singkat:** Analisa potensi alasan atau motivasi di balik perilaku siswa ini dari sudut pandang perkembangan dan psikologi remaja.\n" .
            "2. **Rekomendasi Tindakan / Actionable Advice:** Berikan 3-5 saran konkret, praktis, dan dapat segera dilakukan oleh Guru atau Wali Kelas untuk membantu siswa ini (misalnya cara pendekatan spesifik atau intervensi).";

        try {
            if ($provider === 'gemini') {
                /** @var \Illuminate\Http\Client\Response $response */
                $response = Http::withoutVerifying()->timeout(30)->withHeaders([
                    'Content-Type' => 'application/json',
                ])->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'temperature' => 0.7,
                    ]
                ]);

                if ($response->successful()) {
                    $data = $response->json();

                    if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                        $recommendation = $data['candidates'][0]['content']['parts'][0]['text'];
                        return response()->json([
                            'data' => [
                                'student_name' => $student->name,
                                'recommendation' => $recommendation
                            ]
                        ]);
                    }
                }

                \Illuminate\Support\Facades\Log::error('Gemini API Error: ' . $response->body());
            } elseif ($provider === 'openai') {
                $response = Http::withoutVerifying()->timeout(30)->withHeaders([
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                ])->post('https://api.openai.com/v1/chat/completions', [
                    'model' => $model,
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'Anda adalah seorang Guru Bimbingan Konseling profesional yang berpengalaman dalam menangani masalah kedisiplinan siswa dengan pendekatan psikologis.'
                        ],
                        [
                            'role' => 'user',
                            'content' => $prompt
                        ]
                    ],
                    'temperature' => 0.7,
                ]);

                if ($response->successful()) {
                    $jsonResponse = $response->json();
                    if (isset($jsonResponse['choices'][0]['message']['content'])) {
                        $recommendation = $jsonResponse['choices'][0]['message']['content'];
                        return response()->json([
                            'data' => [
                                'student_name' => $student->name,
                                'recommendation' => $recommendation
                            ]
                        ]);
                    }
                }

                \Illuminate\Support\Facades\Log::error('OpenAI API Error: ' . $response->body());
            }

            return response()->json([
                'message' => 'Gagal mendapatkan respon yang valid dari AI Provider.',
                'details' => isset($response) ? $response->json() : 'Provider tidak didukung.'
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Terjadi kesalahan saat menghubungi API AI Provider.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
