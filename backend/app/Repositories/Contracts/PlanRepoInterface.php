<?php

namespace App\Repositories\Contracts;

use App\Models\Plan;

interface PlanRepoInterface
{
    public function findByCode(string $code): ?Plan;
}
