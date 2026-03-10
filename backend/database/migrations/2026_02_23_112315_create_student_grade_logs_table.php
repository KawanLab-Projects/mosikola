<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_grade_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('academic_year_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('from_classroom_id')
                ->constrained('classrooms')
                ->cascadeOnDelete();

            $table->foreignId('to_classroom_id')
                ->nullable()
                ->constrained('classrooms')
                ->nullOnDelete();

            $table->enum('action', ['promoted', 'demoted', 'archived']);

            $table->foreignId('performed_by')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_grade_logs');
    }
};
