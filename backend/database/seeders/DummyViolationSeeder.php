<?php

namespace Database\Seeders;

use App\Models\Student;
use App\Models\StudentViolation;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Violation;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DummyViolationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $tenant = Tenant::first();
        if (! $tenant) {
            $this->command->error('No tenant found. Please migrate and seed basic data first.');

            return;
        }

        // Get the first active student
        $student = Student::where('tenant_id', $tenant->id)->where('status', 'active')->first();

        if (! $student) {
            $this->command->error("No active student found in tenant {$tenant->name}.");

            return;
        }

        $user = User::whereHas('tenantUsers', function ($q) use ($tenant) {
            $q->where('tenant_id', $tenant->id);
        })->first();

        $userId = $user ? $user->id : 1;

        // Create some heavy violations
        $violations = [
            ['name' => 'Membawa Senjata Tajam (Dummy)', 'points' => 50],
            ['name' => 'Berkelahi di Lingkungan Sekolah (Dummy)', 'points' => 30],
            ['name' => 'Merokok di area sekolah (Dummy)', 'points' => 25],
        ];

        $createdViolations = [];
        foreach ($violations as $vData) {
            $createdViolations[] = Violation::firstOrCreate(
                ['tenant_id' => $tenant->id, 'name' => $vData['name']],
                ['points' => $vData['points']]
            );
        }

        // Assign these violations to the student so they have > 100 points
        foreach ($createdViolations as $index => $violation) {
            StudentViolation::create([
                'tenant_id' => $tenant->id,
                'student_id' => $student->id,
                'violation_id' => $violation->id,
                'date' => Carbon::now()->subDays(3 - $index)->format('Y-m-d'),
                'notes' => 'Otomatis dari DummyViolationSeeder untuk testing Surat Peringatan',
                'recorded_by_user_id' => $userId,
            ]);
        }

        $totalPoints = collect($createdViolations)->sum('points');

        $this->command->info("Successfully added {$totalPoints} violation points to student: ".$student->name);
    }
}
