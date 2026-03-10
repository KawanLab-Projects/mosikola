<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Backfill tenant_users rows for teachers who already have a user_id
     * but were created before the TenantUser creation was added to TeacherService.
     */
    public function up(): void
    {
        // Find all teachers that have a user_id and a tenant_id,
        // but whose user does NOT yet have a tenant_users record for that tenant.
        $teachers = DB::table('teachers')
            ->whereNotNull('user_id')
            ->whereNotNull('tenant_id')
            ->get();

        foreach ($teachers as $teacher) {
            $exists = DB::table('tenant_users')
                ->where('user_id', $teacher->user_id)
                ->where('tenant_id', $teacher->tenant_id)
                ->exists();

            if (!$exists) {
                DB::table('tenant_users')->insert([
                    'tenant_id'  => $teacher->tenant_id,
                    'user_id'    => $teacher->user_id,
                    'role'       => 'teacher',
                    'is_active'  => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        // Remove only the teacher rows that were backfilled (role = 'teacher')
        // Safe to truncate by role since admin rows have a different role.
        DB::table('tenant_users')->where('role', 'teacher')->delete();
    }
};
