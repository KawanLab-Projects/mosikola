<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_journals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('schedule_id')->constrained('schedules')->cascadeOnDelete();
            $table->date('date');
            $table->string('room', 50)->nullable();
            $table->text('topic')->nullable();
            $table->text('notes')->nullable();
            $table->text('homework')->nullable();
            $table->enum('status', ['pending', 'filled', 'excused'])->default('pending');
            $table->timestamp('filled_at')->nullable();
            $table->json('photos')->nullable();
            $table->timestamps();

            $table->unique(['schedule_id', 'date']);
            $table->index(['tenant_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_journals');
    }
};
