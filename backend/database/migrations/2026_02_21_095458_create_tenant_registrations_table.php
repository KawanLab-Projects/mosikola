<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tenant_registrations', function (Blueprint $table) {
            $table->id();

            $table->string('school_name');
            $table->string('slug')->unique(); // calon subdomain
            $table->string('school_type'); // smk, sma, smp, sd, dll

            $table->string('email');
            $table->string('phone')->nullable();

            $table->string('contact_person');

            $table->foreignId('plan_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->enum('status', [
                'pending',
                'approved',
                'rejected'
            ])->default('pending');

            $table->text('rejection_reason')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_registrations');
    }
};
