<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->foreignId('classroom_id')->constrained('classrooms')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->tinyInteger('day_of_week')->comment('1=Monday, 2=Tuesday, ..., 5=Friday');
            $table->tinyInteger('period_start')->comment('Period number where session starts (1-10)');
            $table->tinyInteger('period_end')->comment('Period number where session ends (1-10)');
            $table->time('start_time');
            $table->time('end_time');
            $table->timestamps();

            $table->unique(
                ['tenant_id', 'academic_year_id', 'classroom_id', 'teacher_id', 'day_of_week', 'period_start'],
                'schedules_unique_slot'
            );

            $table->index(['tenant_id', 'academic_year_id']);
            $table->index(['teacher_id', 'day_of_week']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
