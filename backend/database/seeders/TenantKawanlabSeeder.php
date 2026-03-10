<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\SubscriptionService;

class TenantKawanlabSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(SubscriptionService $subscriptionService): void
    {
        // 1. Create admin user
        $user = User::create([
            'name'     => 'Mohamad Latief Mohi, S.Kom',
            'email'    => 'admin@kawanlab.com',
            'password' => 'password', // Auto-hashed by User model depending on setup, but typically models do it. Or we can use bcrypt just in case.
        ]);

        // Ensure hashed if model doesn't cast password automatically
        if (Hash::needsRehash($user->password)) {
            $user->password = bcrypt('password');
            $user->save();
        }

        $user->assignRole('admin');

        // 2. Create tenant
        $tenant = Tenant::create([
            'public_id'     => (string) Str::uuid(),
            'name'          => 'SMK AKADEMI KAWANLAB',
            'slug'          => 'smk-akademi-kawanlab',
            'school_type'   => 'SMK',
            'email'         => 'admin@kawanlab.com',
            'phone'         => '081234567890', // Default dummy phone
            'is_active'     => true,
        ]);

        // 3. Link user to tenant
        TenantUser::create([
            'tenant_id'     => $tenant->id,
            'user_id'       => $user->id,
            'role'          => 'admin',
            'is_active'     => true,
        ]);

        // 4. Assign default Perintis plan
        $subscriptionService->assignDefaultPlan($tenant->id);
    }
}
