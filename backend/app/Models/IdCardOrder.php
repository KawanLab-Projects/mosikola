<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IdCardOrder extends Model
{
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'tenant_id',
        'template_id',
        'card_type',
        'total_price',
        'status',
        'shipping_info',
        'payment_method',
        'shipping_receipt_number',
        'created_by',
    ];

    protected $casts = [
        'total_price' => 'integer',
        'shipping_info' => 'array',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function template()
    {
        return $this->belongsTo(IdCardTemplate::class);
    }

    public function items()
    {
        return $this->hasMany(IdCardOrderItem::class, 'order_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function transactions()
    {
        return $this->morphMany(Transaction::class, 'payable');
    }

    /**
     * Called by XenditWebhookController when payment is confirmed PAID.
     * Moves the order status to 'processing' so the Superadmin can start fulfillment.
     */
    public function handlePaymentSuccess(Transaction $transaction): void
    {
        $this->status = 'processing';
        $this->save();
    }

    /**
     * Called by XenditWebhookController when the Xendit invoice expires without payment.
     */
    public function handlePaymentExpired(Transaction $transaction): void
    {
        // Only revert if still pending
        if ($this->status === 'pending') {
            $this->status = 'payment_failed';
            $this->save();
        }
    }
}
