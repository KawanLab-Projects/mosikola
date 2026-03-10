<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_journal_id')->constrained('lesson_journals')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->enum('status', ['hadir', 'sakit', 'izin', 'alpha'])->default('hadir');
            $table->string('notes', 255)->nullable();
            $table->timestamps();

            $table->unique(['lesson_journal_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_attendances');
    }
};
