<?php

namespace App\Http\Controllers;

use App\Repositories\Contracts\TenantRepoInterface;
use Illuminate\Http\JsonResponse;

class SuperadminTenantController extends Controller
{
    public function __construct(
        private TenantRepoInterface $tenantRepo
    ) {}

    public function index(): JsonResponse
    {
        $tenants = $this->tenantRepo->getAllWithDetails();

        $data = $tenants->map(function ($tenant) {
            $plan = $tenant->activeSubscription?->plan;

            return [
                'id' => $tenant->id,
                'public_id' => $tenant->public_id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'email' => $tenant->email,
                'phone' => $tenant->phone,
                'is_active' => $tenant->is_active,
                'created_at' => $tenant->created_at->toISOString(),
                'plan_name' => $plan ? $plan->name : 'No Plan',
                'plan_code' => $plan ? $plan->code : null,
                'student_limit' => $plan ? $plan->student_limit : 0,
                // Dummy counts for now
                'teachers_count' => 0,
                'students_count' => 0,
                'upgrade_request' => null,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $data,
        ]);
    }
}
