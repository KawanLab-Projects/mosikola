<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('classrooms', function (Blueprint $table) {
            $table->id();
            $table->uuid('public_id')->default(DB::raw('gen_random_uuid()'));
            $table->string('name');
            $table->foreignId('study_program_id')->references('id')->on('study_programs')->onDelete('cascade');
            $table->string('short');
            $table->tinyInteger('grade_level'); // SD/MI: 1-6, SMP/MTS: 7-9, SMA/SMK: 10-12
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('classrooms');
    }
};
