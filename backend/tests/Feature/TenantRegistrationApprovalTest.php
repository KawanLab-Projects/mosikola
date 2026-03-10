<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\Tenant;
use App\Models\TenantRegistration;
use App\Models\User;
use App\Mail\RegistrationApproved;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TenantRegistrationApprovalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Create admin role for Spatie
        Role::create(['name' => 'admin']);
    }

    public function test_superadmin_can_list_registrations()
    {
        TenantRegistration::factory()->count(3)->create();

        // Acting as a user (sanctum auth)
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/registrations');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_superadmin_can_approve_registration()
    {
        Mail::fake();

        $plan = Plan::create([
            'name' => 'Basic',
            'code' => 'basic',
            'student_limit' => 100,
            'price' => 0,
            'is_active' => true
        ]);

        $registration = TenantRegistration::create([
            'school_name' => 'Test School',
            'slug' => 'test-school',
            'email' => 'pic@test.com',
            'contact_person' => 'PIC Name',
            'plan_id' => $plan->id,
            'status' => 'pending'
        ]);

        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson("/api/registrations/{$registration->id}/approve");

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Pendaftaran berhasil disetujui.');

        // Verify registration status
        $this->assertEquals('approved', $registration->fresh()->status);

        // Verify Tenant creation
        $this->assertDatabaseHas('tenants', [
            'name' => 'Test School',
            'slug' => 'test-school',
            'email' => 'pic@test.com'
        ]);

        // Verify User creation
        $this->assertDatabaseHas('users', [
            'email' => 'pic@test.com',
            'name' => 'PIC Name'
        ]);

        $newUser = User::where('email', 'pic@test.com')->first();
        $this->assertTrue($newUser->hasRole('admin'));

        // Verify Mail sent
        Mail::assertSent(RegistrationApproved::class, function ($mail) use ($registration) {
            return $mail->hasTo('pic@test.com') &&
                $mail->registration->id === $registration->id;
        });
    }

    public function test_cannot_approve_already_processed_registration()
    {
        $registration = TenantRegistration::create([
            'school_name' => 'Processed School',
            'slug' => 'processed',
            'email' => 'pic@processed.com',
            'contact_person' => 'PIC',
            'status' => 'approved'
        ]);

        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson("/api/registrations/{$registration->id}/approve");

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Pendaftaran sudah diproses.');
    }
}
