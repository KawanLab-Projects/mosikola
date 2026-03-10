<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * PostgreSQL doesn't support ALTER COLUMN for enum changes directly.
     * We drop the check constraint and add a new one with Indonesian values.
     */
    public function up(): void
    {
        // Drop the old check constraint (PostgreSQL names it automatically as <table>_<column>_check)
        DB::statement('ALTER TABLE lesson_attendances DROP CONSTRAINT IF EXISTS lesson_attendances_status_check');

        // Set default to new value
        DB::statement("ALTER TABLE lesson_attendances ALTER COLUMN status SET DEFAULT 'hadir'");

        // Update existing rows with old English values to new Indonesian values
        DB::statement("UPDATE lesson_attendances SET status = 'hadir'  WHERE status = 'present'");
        DB::statement("UPDATE lesson_attendances SET status = 'sakit'  WHERE status = 'sick'");
        DB::statement("UPDATE lesson_attendances SET status = 'izin'   WHERE status = 'excused'");
        DB::statement("UPDATE lesson_attendances SET status = 'alpha'  WHERE status = 'absent'");

        // Add new check constraint with Indonesian values
        DB::statement("ALTER TABLE lesson_attendances ADD CONSTRAINT lesson_attendances_status_check CHECK (status IN ('hadir', 'sakit', 'izin', 'alpha'))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE lesson_attendances DROP CONSTRAINT IF EXISTS lesson_attendances_status_check');
        DB::statement("ALTER TABLE lesson_attendances ALTER COLUMN status SET DEFAULT 'present'");

        DB::statement("UPDATE lesson_attendances SET status = 'present' WHERE status = 'hadir'");
        DB::statement("UPDATE lesson_attendances SET status = 'sick'    WHERE status = 'sakit'");
        DB::statement("UPDATE lesson_attendances SET status = 'excused' WHERE status = 'izin'");
        DB::statement("UPDATE lesson_attendances SET status = 'absent'  WHERE status = 'alpha'");

        DB::statement("ALTER TABLE lesson_attendances ADD CONSTRAINT lesson_attendances_status_check CHECK (status IN ('present', 'sick', 'excused', 'absent'))");
    }
};
