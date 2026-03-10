<?php

namespace App\Services;

use App\Models\Subscription;
use App\Repositories\Contracts\PlanRepoInterface;
use App\Repositories\Contracts\SubscriptionRepoInterface;
use Exception;

class SubscriptionService
{
    public function __construct(
        private SubscriptionRepoInterface $subscriptionRepo,
        private PlanRepoInterface $planRepo,
    ) {}

    public function assignDefaultPlan(int $tenantId): Subscription
    {
        $plan = $this->planRepo->findByCode('gratis');

        if (!$plan) {
            throw new Exception("Plan 'gratis' tidak ditemukan. Pastikan seeder sudah dijalankan.");
        }

        return $this->subscriptionRepo->createForTenant($tenantId, $plan->id);
    }
}
