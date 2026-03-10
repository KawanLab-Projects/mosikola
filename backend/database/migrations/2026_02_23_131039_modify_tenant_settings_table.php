<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_settings', function (Blueprint $table) {
            // Add the key-value group columns
            $table->foreignId('tenant_id')->after('id')->constrained('tenants')->onDelete('cascade');
            $table->string('group')->after('tenant_id');
            $table->string('key')->after('group');
            $table->text('value')->nullable()->after('key');

            $table->unique(['tenant_id', 'group', 'key']);
        });
    }

    public function down(): void
    {
        Schema::table('tenant_settings', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'group', 'key']);
            $table->dropForeign(['tenant_id']);
            $table->dropColumn(['tenant_id', 'group', 'key', 'value']);
        });
    }
};
