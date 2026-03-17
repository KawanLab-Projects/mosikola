<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    /**
     * Display a listing of subscriptions (with related plan and tenant)
     */
    public function index()
    {
        $subscriptions = Subscription::with(['plan', 'tenant'])->get();

        return response()->json(['data' => $subscriptions]);
    }

    /**
     * Store (or forcefully override) a subscription for a tenant.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'plan_id' => 'required|exists:plans,id',
            'locked_price' => 'nullable|numeric|min:0',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $tenant = Tenant::findOrFail($validated['tenant_id']);
        $plan = \App\Models\Plan::findOrFail($validated['plan_id']);

        // Inactivate all existing subscriptions
        $tenant->subscriptions()->update(['is_active' => false]);

        $startDate = $validated['start_date'] ?? now()->toDateString();
        $endDate = $validated['end_date'] ?? now()->addYear()->toDateString();
        $lockedPrice = $validated['locked_price'] ?? $plan->price;

        $subscription = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'locked_price' => $lockedPrice,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'is_active' => true,
        ]);

        return response()->json(['data' => $subscription->load('plan')], 201);
    }

    /**
     * Terminate the specified subscription.
     */
    public function destroy(string $id)
    {
        $subscription = Subscription::findOrFail($id);
        $subscription->update(['is_active' => false]);

        return response()->json(null, 204);
    }
}
