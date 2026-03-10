<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('classrooms', function (Blueprint $table) {
            // Drop the existing FK constraint first
            $table->dropForeign(['study_program_id']);
            // Make the column nullable and re-add the constraint
            $table->foreignId('study_program_id')
                ->nullable()
                ->change();
            $table->foreign('study_program_id')
                ->references('id')
                ->on('study_programs')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('classrooms', function (Blueprint $table) {
            $table->dropForeign(['study_program_id']);
            $table->foreignId('study_program_id')
                ->nullable(false)
                ->change();
            $table->foreign('study_program_id')
                ->references('id')
                ->on('study_programs')
                ->onDelete('cascade');
        });
    }
};
