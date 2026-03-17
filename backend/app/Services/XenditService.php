<?php

namespace App\Services;

use App\Models\GlobalSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class XenditService
{
    protected string $baseUrl = 'https://api.xendit.co';

    protected string $secretKey;

    public function __construct()
    {
        // Prefer DB-stored key (set via superadmin UI); fall back to config/env
        $this->secretKey = GlobalSetting::where('key', 'xendit_secret_key')->value('value')
            ?? config('services.xendit.secret_key', '');
    }

    /**
     * Create a Xendit Invoice.
     *
     * @param  array{
     *   external_id: string,
     *   amount: int|float,
     *   description: string,
     *   payer_email?: string,
     *   success_redirect_url?: string,
     *   failure_redirect_url?: string,
     *   currency?: string,
     *   items?: array,
     * } $params
     * @return array Xendit invoice object
     *
     * @throws \RuntimeException on API failure
     */
    public function createInvoice(array $params): array
    {
        $payload = array_merge([
            'currency' => 'IDR',
            'should_send_email' => true,
        ], $params);

        $response = Http::withBasicAuth($this->secretKey, '')
            ->post("{$this->baseUrl}/v2/invoices", $payload);

        if ($response->failed()) {
            Log::error('[XenditService] createInvoice failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'payload' => $params,
            ]);
            throw new \RuntimeException(
                'Gagal membuat invoice Xendit: '.($response->json('message') ?? $response->body())
            );
        }

        return $response->json();
    }

    /**
     * Retrieve a Xendit Invoice by its ID.
     */
    public function getInvoice(string $invoiceId): array
    {
        $response = Http::withBasicAuth($this->secretKey, '')
            ->get("{$this->baseUrl}/v2/invoices/{$invoiceId}");

        if ($response->failed()) {
            throw new \RuntimeException('Gagal mengambil invoice Xendit: '.$response->body());
        }

        return $response->json();
    }
}
