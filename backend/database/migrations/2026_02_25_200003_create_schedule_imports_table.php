<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedule_imports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->string('filename');
            $table->foreignId('uploaded_by')->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['pending', 'success', 'partial', 'failed'])->default('pending');
            $table->json('summary')->nullable()->comment('matched/unmatched/written counts');
            $table->timestamps();

            $table->index(['tenant_id', 'academic_year_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedule_imports');
    }
};
