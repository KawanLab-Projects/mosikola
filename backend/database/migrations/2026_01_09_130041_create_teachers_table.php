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
        Schema::create('teachers', function (Blueprint $table) {
            $table->id();
            $table->uuid('public_id')->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->string('nip')->unique();
            $table->string('name');
            $table->foreignId('classroom_id')->nullable()->references('id')->on('classrooms')->onDelete('set null');
            $table->string('phone_number')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teachers');
    }
};
