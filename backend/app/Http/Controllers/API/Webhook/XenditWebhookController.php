<?php

namespace App\Http\Controllers\Api\Webhook;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class XenditWebhookController extends Controller
{
    public function handleInvoice(Request $request)
    {
        // 1. Verify Xendit Webhook Signature
        // The x-callback-token header should match the token on Xendit Dashboard settings
        $xenditToken   = config('services.xendit.webhook_token');
        $callbackToken = $request->header('x-callback-token');

        if ($xenditToken && $callbackToken !== $xenditToken) {
            return response()->json(['message' => 'Invalid Callback Token'], 403);
        }

        $payload = $request->all();
        
        $externalId = $payload['external_id'] ?? null;
        $status = $payload['status'] ?? null;

        if (!$externalId || !$status) {
            return response()->json(['message' => 'Invalid payload format'], 400);
        }

        // 2. Find the transaction
        $transaction = \App\Models\Transaction::where('reference_id', $externalId)->first();

        if (!$transaction) {
            return response()->json(['message' => 'Transaction not found'], 404);
        }

        // If the transaction is already marked paid, we just acknowledge
        if ($transaction->status === 'PAID') {
            return response()->json(['message' => 'Transaction already paid']);
        }

        // 3. Update Transaction status based on Payload Status
        if ($status === 'PAID' || $status === 'SETTLED') {
            $transaction->status = 'PAID';
            $transaction->payment_method = $payload['payment_method'] ?? null;
            $transaction->paid_at = now();

            // Additional fallback parsing for specific methods
            // Xendit might provide the exact channel like 'BCA', 'DANA'
            if (isset($payload['payment_channel'])) {
                $transaction->payment_method .= ' - ' . $payload['payment_channel'];
            }

            $transaction->save();
            
            // 4. Delegate to the polymorphic payable model
            // Define an interface / method that every purchasable product must implement
            if ($transaction->payable && method_exists($transaction->payable, 'handlePaymentSuccess')) {
                // E.g., IdCardOrder->handlePaymentSuccess(), PlanSubscription->handlePaymentSuccess()
                $transaction->payable->handlePaymentSuccess($transaction);
            }
            
            return response()->json(['message' => 'Payment processed successfully']);
        } 
        
        if ($status === 'EXPIRED') {
            $transaction->status = 'EXPIRED';
            $transaction->save();
            
            if ($transaction->payable && method_exists($transaction->payable, 'handlePaymentExpired')) {
                $transaction->payable->handlePaymentExpired($transaction);
            }
            return response()->json(['message' => 'Invoice expired']);
        }

        return response()->json(['message' => 'Webhook received for unhandled status: ' . $status]);
    }
}
