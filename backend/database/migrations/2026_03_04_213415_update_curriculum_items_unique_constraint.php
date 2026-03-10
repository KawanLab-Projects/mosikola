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
        Schema::table('curriculum_items', function (Blueprint $table) {
            $table->dropUnique('curriculum_items_unique');
            $table->unique(
                ['tenant_id', 'academic_year_id', 'classroom_id', 'subject_id', 'teacher_id'],
                'curriculum_items_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('curriculum_items', function (Blueprint $table) {
            $table->dropUnique('curriculum_items_unique');
            $table->unique(
                ['tenant_id', 'academic_year_id', 'classroom_id', 'subject_id'],
                'curriculum_items_unique'
            );
        });
    }
};
