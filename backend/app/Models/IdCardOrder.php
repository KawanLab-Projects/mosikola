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
}
