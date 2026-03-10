<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained('tenants')->onDelete('cascade');
            $table->enum('type', ['check_in', 'check_out'])->default('check_in')->after('attendance_date');
            $table->enum('status', ['hadir', 'terlambat'])->default('hadir')->after('type');
            $table->enum('method', ['qr', 'nfc', 'manual'])->default('qr')->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropForeign(['academic_year_id']);
            $table->dropColumn(['tenant_id', 'academic_year_id', 'type', 'status', 'method']);
        });
    }
};
