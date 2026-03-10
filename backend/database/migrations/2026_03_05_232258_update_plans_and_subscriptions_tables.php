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
        Schema::table('plans', function (Blueprint $table) {
            $table->integer('teacher_limit')->nullable()->after('student_limit');
            $table->json('features')->nullable()->after('notification_enabled');
            $table->decimal('early_bird_price', 15, 2)->nullable()->after('price');
            $table->integer('early_bird_limit')->nullable()->after('early_bird_price');
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->decimal('locked_price', 15, 2)->default(0)->after('plan_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['teacher_limit', 'features', 'early_bird_price', 'early_bird_limit']);
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn('locked_price');
        });
    }
};
