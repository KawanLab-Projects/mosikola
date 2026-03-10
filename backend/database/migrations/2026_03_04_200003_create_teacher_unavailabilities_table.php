<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teacher_unavailabilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->tinyInteger('day_of_week');               // 1=Mon ... 5=Fri
            $table->tinyInteger('period_number');             // matches school_periods.period_number
            $table->timestamps();

            $table->unique(
                ['teacher_id', 'academic_year_id', 'day_of_week', 'period_number'],
                'teacher_unavail_unique'
            );
            $table->index(['teacher_id', 'academic_year_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_unavailabilities');
    }
};
