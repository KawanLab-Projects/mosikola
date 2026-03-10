<?php

namespace App\Repositories\Contracts;

use App\Models\Subscription;

interface SubscriptionRepoInterface
{
    public function createForTenant(int $tenantId, int $planId): Subscription;
}
