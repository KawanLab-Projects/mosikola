<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->tinyInteger('period_number');             // 1, 2, 3, ...
            $table->time('start_time');                       // 07:30
            $table->time('end_time');                         // 08:15
            $table->boolean('is_break')->default(false);
            $table->string('label')->nullable();              // "Jam ke-1", "Istirahat 1"
            $table->timestamps();

            $table->unique(['tenant_id', 'period_number'], 'school_periods_unique');
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_periods');
    }
};
