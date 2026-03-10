<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teacher_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->foreignId('classroom_id')->constrained('classrooms')->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->enum('assignment_type', ['wali_kelas', 'guru_bk', 'guru_mapel']);
            $table->string('subject')->nullable(); // only for guru_mapel
            $table->timestamps();

            // Each classroom can only have 1 wali_kelas per academic year,
            // and 1 guru_mapel per subject per classroom per academic year.
            // Enforced at service layer. No DB partial index (Laravel compatibility).
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_assignments');
    }
};
