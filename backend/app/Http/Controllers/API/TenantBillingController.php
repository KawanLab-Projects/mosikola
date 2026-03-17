<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Transaction;
use App\Services\XenditService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TenantBillingController extends Controller
{
    /**
     * Return the active subscription + plan details for the authenticated tenant.
     */
    public function currentSubscription(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();
        $tenantUser = $user->tenantUsers()->where('is_active', true)->with('tenant.activeSubscription.plan')->first();

        abort_if(! $tenantUser, 403, 'Tidak ada tenant aktif.');

        $subscription = $tenantUser->tenant->activeSubscription;

        return response()->json([
            'subscription' => $subscription,
            'plan' => $subscription?->plan,
        ]);
    }

    /**
     * Initiate a plan upgrade payment via Xendit.
     * Creates a pending Subscription + Transaction and returns an invoice URL.
     */
    public function initiateUpgrade(Request $request)
    {
        $validated = $request->validate([
            'plan_id' => 'required|exists:plans,id',
        ]);

        /** @var \App\Models\User $user */
        $user = auth()->user();
        $tenantUser = $user->tenantUsers()->where('is_active', true)->with('tenant.activeSubscription')->first();

        abort_if(! $tenantUser, 403, 'Tidak ada tenant aktif.');

        $tenant = $tenantUser->tenant;
        $plan = Plan::findOrFail($validated['plan_id']);

        // Determine price: use early bird price if quota is still available
        $price = $plan->price;
        if ($plan->early_bird_price && $plan->early_bird_limit) {
            $soldCount = Subscription::where('plan_id', $plan->id)->count();
            if ($soldCount < $plan->early_bird_limit) {
                $price = $plan->early_bird_price;
            }
        }

        // Prevent duplicate pending upgrades for this plan
        $existingTx = Transaction::where('tenant_id', $tenant->id)
            ->where('status', 'PENDING')
            ->whereHasMorph('payable', [Subscription::class], function ($q) use ($plan) {
                $q->where('plan_id', $plan->id);
            })
            ->first();

        if ($existingTx) {
            return response()->json([
                'invoice_url' => $existingTx->xendit_invoice_url,
                'transaction_id' => $existingTx->id,
                'reference_id' => $existingTx->reference_id,
            ]);
        }

        // Create a pending Subscription record (not yet active)
        $subscription = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'locked_price' => $price,
            'start_date' => now()->toDateString(),   // provisional; will be reset on payment
            'end_date' => now()->addYear()->toDateString(),
            'is_active' => false,                    // activated only after payment
        ]);

        $referenceId = 'PLAN-'.strtoupper(Str::random(10)).'-T'.$tenant->id;

        $transaction = Transaction::create([
            'tenant_id' => $tenant->id,
            'reference_id' => $referenceId,
            'payable_type' => Subscription::class,
            'payable_id' => $subscription->id,
            'amount' => $price,
            'status' => 'PENDING',
        ]);

        $invoiceUrl = null;
        $xenditInvoiceId = null;

        if (config('services.xendit.secret_key')) {
            try {
                $xenditService = app(XenditService::class);
                $invoice = $xenditService->createInvoice([
                    'external_id' => $referenceId,
                    'amount' => (int) $price,
                    'description' => 'Upgrade ke Paket '.$plan->name.' – '.$tenant->name,
                    'payer_email' => $user->email,
                    'success_redirect_url' => config('app.frontend_url', config('app.url')).'/dashboard/billing?status=success',
                    'failure_redirect_url' => config('app.frontend_url', config('app.url')).'/dashboard/billing?status=failed',
                ]);

                $invoiceUrl = $invoice['invoice_url'] ?? null;
                $xenditInvoiceId = $invoice['id'] ?? null;
            } catch (\Throwable $e) {
                // Clean up and surface failed
                $transaction->delete();
                $subscription->delete();

                return response()->json(['message' => $e->getMessage()], 502);
            }
        }

        $transaction->xendit_invoice_url = $invoiceUrl;
        $transaction->xendit_invoice_id = $xenditInvoiceId;
        $transaction->save();

        return response()->json([
            'invoice_url' => $invoiceUrl,
            'transaction_id' => $transaction->id,
            'reference_id' => $referenceId,
            'amount' => $price,
            'plan' => $plan,
        ], 201);
    }
}
