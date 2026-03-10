<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $plans = Plan::all();
        return response()->json(['data' => $plans]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:plans,code',
            'student_limit' => 'nullable|integer',
            'teacher_limit' => 'nullable|integer',
            'price' => 'numeric|min:0',
            'early_bird_price' => 'nullable|numeric|min:0',
            'early_bird_limit' => 'nullable|integer|min:0',
            'attendance_enabled' => 'boolean',
            'parent_monitoring_enabled' => 'boolean',
            'notification_enabled' => 'boolean',
            'features' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $plan = Plan::create($validated);

        return response()->json(['data' => $plan], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $plan = Plan::findOrFail($id);
        return response()->json(['data' => $plan]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $plan = Plan::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|required|string|unique:plans,code,' . $id,
            'student_limit' => 'nullable|integer',
            'teacher_limit' => 'nullable|integer',
            'price' => 'sometimes|numeric|min:0',
            'early_bird_price' => 'nullable|numeric|min:0',
            'early_bird_limit' => 'nullable|integer|min:0',
            'attendance_enabled' => 'boolean',
            'parent_monitoring_enabled' => 'boolean',
            'notification_enabled' => 'boolean',
            'features' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $plan->update($validated);

        return response()->json(['data' => $plan]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $plan = Plan::findOrFail($id);
        // Only allow deletion if no subscriptions exist to maintain integrity
        if ($plan->subscriptions()->exists()) {
            return response()->json(['message' => 'Cannot delete plan with active subscriptions.'], 400);
        }

        $plan->delete();

        return response()->json(null, 204);
    }
}
