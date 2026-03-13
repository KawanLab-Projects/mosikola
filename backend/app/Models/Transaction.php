<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'tenant_id',
        'reference_id',
        'payable_type',
        'payable_id',
        'xendit_invoice_url',
        'xendit_invoice_id',
        'amount',
        'status',
        'payment_method',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    /**
     * Get the parent payable model (PlanSubscription, IdCardOrder, etc).
     */
    public function payable()
    {
        return $this->morphTo();
    }
}
