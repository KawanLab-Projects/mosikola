<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('id_card_orders', function (Blueprint $table) {
            $table->string('id')->primary(); // custom invoice format: ORD-KARTU-1234
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('template_id')->constrained('id_card_templates')->cascadeOnDelete();
            $table->integer('total_price');
            $table->enum('status', ['pending', 'paid', 'on_progress', 'shipping', 'completed'])->default('pending');
            $table->json('shipping_info')->nullable();
            $table->string('payment_method')->nullable();
            $table->string('shipping_receipt_number')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('id_card_orders');
    }
};
