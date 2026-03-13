<?php

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\GlobalSetting;
use App\Services\XenditService;
use Illuminate\Http\Request;

class XenditSettingController extends Controller
{
    private const KEYS = [
        'xendit_secret_key',
        'xendit_webhook_token',
        'xendit_frontend_url',
    ];

    /**
     * Return Xendit settings.
     * The secret key is masked to avoid exposing it in the browser.
     */
    public function index()
    {
        $raw = GlobalSetting::whereIn('key', self::KEYS)
            ->get()
            ->pluck('value', 'key');

        // Mask the secret key: show only last 4 characters
        $secretKey = $raw['xendit_secret_key'] ?? null;
        if ($secretKey && strlen($secretKey) > 4) {
            $masked = str_repeat('•', max(0, strlen($secretKey) - 4)) . substr($secretKey, -4);
        } else {
            $masked = $secretKey ? str_repeat('•', strlen($secretKey)) : null;
        }

        return response()->json([
            'status' => 'success',
            'data'   => [
                'xendit_secret_key'    => $masked,
                'xendit_webhook_token' => $raw['xendit_webhook_token'] ?? null,
                'xendit_frontend_url'  => $raw['xendit_frontend_url'] ?? null,
                'is_configured'        => !empty($secretKey),
            ],
        ]);
    }

    /**
     * Persist Xendit settings.
     * If xendit_secret_key is omitted or looks like a masked value (contains '•'),
     * the existing secret key is kept unchanged.
     */
    public function update(Request $request)
    {
        $data = $request->validate([
            'xendit_secret_key'    => 'nullable|string|max:255',
            'xendit_webhook_token' => 'nullable|string|max:255',
            'xendit_frontend_url'  => 'nullable|url|max:255',
        ]);

        foreach ($data as $key => $value) {
            // Skip saving the secret key if it still contains masking characters
            if ($key === 'xendit_secret_key' && str_contains((string) $value, '•')) {
                continue;
            }
            // Skip null / empty values for key fields (keep existing)
            if (in_array($key, ['xendit_secret_key', 'xendit_webhook_token']) && empty($value)) {
                continue;
            }
            GlobalSetting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Pengaturan Xendit berhasil disimpan.',
        ]);
    }

    /**
     * Test the configured Xendit credentials by fetching balance.
     */
    public function testConnection()
    {
        $secretKey = GlobalSetting::where('key', 'xendit_secret_key')->value('value')
            ?? config('services.xendit.secret_key');

        if (!$secretKey) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Secret Key belum dikonfigurasi.',
            ], 422);
        }

        try {
            $response = \Illuminate\Support\Facades\Http::withBasicAuth($secretKey, '')
                ->timeout(10)
                ->get('https://api.xendit.co/balance');

            if ($response->successful()) {
                $balance = $response->json('balance') ?? $response->json('money_in_amount');
                return response()->json([
                    'status'  => 'success',
                    'message' => 'Koneksi berhasil! Balance: IDR ' . number_format((float) ($balance ?? 0), 0, ',', '.'),
                ]);
            }

            return response()->json([
                'status'  => 'error',
                'message' => 'Xendit merespons dengan error: ' . ($response->json('message') ?? 'Unknown error') . ' (HTTP ' . $response->status() . ')',
            ], 400);
        } catch (\Throwable $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal terhubung ke Xendit: ' . $e->getMessage(),
            ], 500);
        }
    }
}
