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
        Schema::create('plans', function (Blueprint $table) {
            $table->id();

            $table->string('name'); // Perintis, Favorit, Excellence
            $table->string('code')->unique(); // perintis, favorit, excellence

            $table->integer('student_limit');
            $table->decimal('price', 15, 2)->default(0);

            $table->boolean('attendance_enabled')->default(true);
            $table->boolean('parent_monitoring_enabled')->default(true);
            $table->boolean('notification_enabled')->default(true);

            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
