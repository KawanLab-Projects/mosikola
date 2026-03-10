<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop the old homeroom pivot table (superseded by teacher_assignments)
        Schema::dropIfExists('class_homeroom_assignments');

        // Drop classroom_id from teachers (now handled by teacher_assignments)
        Schema::table('teachers', function (Blueprint $table) {
            $table->dropForeign(['classroom_id']);
            $table->dropColumn('classroom_id');
        });
    }

    public function down(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            $table->foreignId('classroom_id')
                ->nullable()
                ->references('id')->on('classrooms')
                ->onDelete('set null');
        });

        Schema::create('class_homeroom_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classroom_id')->references('id')->on('classrooms')->onDelete('cascade');
            $table->foreignId('teacher_id')->references('id')->on('teachers')->onDelete('cascade');
            $table->timestamps();
        });
    }
};
