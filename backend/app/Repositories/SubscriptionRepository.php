<?php

namespace App\Repositories;

use App\Models\Subscription;
use App\Repositories\Contracts\SubscriptionRepoInterface;

class SubscriptionRepository implements SubscriptionRepoInterface
{
    public function createForTenant(int $tenantId, int $planId): Subscription
    {
        $plan = \App\Models\Plan::findOrFail($planId);

        $lockedPrice = $plan->price;
        if ($plan->early_bird_limit > 0 && $plan->early_bird_price !== null) {
            $currentSubscribers = Subscription::where('plan_id', $planId)
                ->distinct('tenant_id')
                ->count();

            if ($currentSubscribers < $plan->early_bird_limit) {
                $lockedPrice = $plan->early_bird_price;
            }
        }

        return Subscription::create([
            'tenant_id' => $tenantId,
            'plan_id' => $planId,
            'locked_price' => $lockedPrice,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addYear()->toDateString(),
            'is_active' => true,
        ]);
    }
}
