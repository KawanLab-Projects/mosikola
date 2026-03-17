<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Subscription extends Model
{
    protected $fillable = [
        'tenant_id',
        'plan_id',
        'locked_price',
        'start_date',
        'end_date',
        'is_active',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function isExpired(): bool
    {
        return now()->greaterThan($this->end_date);
    }

    public function transactions()
    {
        return $this->morphMany(Transaction::class, 'payable');
    }

    /**
     * Called by XenditWebhookController when the plan upgrade payment is confirmed.
     * Activates this subscription and deactivates all previous active ones for the tenant.
     */
    public function handlePaymentSuccess(Transaction $transaction): void
    {
        DB::transaction(function () {
            // Deactivate all other active subscriptions for this tenant
            Subscription::where('tenant_id', $this->tenant_id)
                ->where('is_active', true)
                ->where('id', '!=', $this->id)
                ->update(['is_active' => false]);

            // Activate this subscription
            $this->is_active = true;
            $this->start_date = now()->toDateString();
            $this->end_date = now()->addYear()->toDateString();
            $this->save();
        });
    }
}
