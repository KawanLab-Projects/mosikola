<?php

namespace App\Repositories;

use App\Models\Plan;
use App\Repositories\Contracts\PlanRepoInterface;

class PlanRepository implements PlanRepoInterface
{
    public function findByCode(string $code): ?Plan
    {
        return Plan::where('code', $code)->where('is_active', true)->first();
    }
}
