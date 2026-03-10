<?php

namespace App\Services;

use App\Models\TenantRegistration;
use App\Repositories\Contracts\TenantRegistrationRepoInterface;
use App\Repositories\Contracts\TenantRepoInterface;
use App\Repositories\Contracts\TenantUserRepoInterface;
use App\Repositories\Contracts\UserRepoInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Exception;

class TenantRegistrationService
{
    public function __construct(
        private TenantRegistrationRepoInterface $registrationRepo,
        private UserRepoInterface $userRepo,
        private TenantRepoInterface $tenantRepo,
        private TenantUserRepoInterface $tenantUserRepo,
        private SubscriptionService $subscriptionService,
    ) {}

    public function registerSchool(array $data): TenantRegistration
    {
        $slug = $data['slug'] ?? Str::slug($data['school_name']);

        if ($this->registrationRepo->existsBySlug($slug)) {
            throw new Exception("Subdomain sudah digunakan. Silakan pilih yang lain.");
        }

        return $this->registrationRepo->create([
            'school_name'    => $data['school_name'],
            'school_type'    => $data['school_type'],
            'slug'           => $slug,
            'email'          => $data['email'],
            'phone'          => $data['whatsapp'] ?? null,
            'contact_person' => $data['pic_name'],
            'plan_id'        => $data['plan_id'] ?? null,
            'status'         => 'pending',
        ]);
    }

    public function listRegistrations(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->registrationRepo->all();
    }

    public function approveRegistration(int $id): TenantRegistration
    {
        $registration = $this->registrationRepo->findById($id);

        if (!$registration) {
            throw new Exception("Pendaftaran tidak ditemukan.");
        }

        if ($registration->status !== 'pending') {
            throw new Exception("Pendaftaran sudah diproses.");
        }

        return DB::transaction(function () use ($registration) {
            $password = Str::random(10);

            // 1. Create admin user via repo
            $user = $this->userRepo->create([
                'name'     => $registration->contact_person,
                'email'    => $registration->email,
                'password' => $password,
            ], 'admin');

            // 2. Create tenant via repo
            $tenant = $this->tenantRepo->create([
                'public_id'     => (string) Str::uuid(),
                'name'          => $registration->school_name,
                'slug'          => $registration->slug,
                'school_type'   => $registration->school_type,
                'email'         => $registration->email,
                'phone'         => $registration->phone,
                'is_active'     => true,
            ]);

            // 3. Link user to tenant via repo
            $this->tenantUserRepo->create([
                'tenant_id'     => $tenant->id,
                'user_id'       => $user->id,
                'role'          => 'admin',
                'is_active'     => true,
            ]);

            // 4. Assign default Gratis plan
            $this->subscriptionService->assignDefaultPlan($tenant->id);

            // 5. Update registration status
            $this->registrationRepo->updateStatus($registration->id, 'approved');

            // 6. Send credentials email
            Mail::to($registration->email)
                ->send(new \App\Mail\RegistrationApproved($registration, $password));

            return $registration->refresh();
        });
    }
}
