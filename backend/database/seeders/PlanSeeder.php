<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name'                      => 'Sekolah Perintis',
                'code'                      => 'perintis',
                'student_limit'             => 50,
                'price'                     => 0.00,
                'attendance_enabled'        => true,
                'parent_monitoring_enabled' => true,
                'notification_enabled'      => true,
                'is_active'                 => true,
            ],
            [
                'name'                      => 'Sekolah Favorit',
                'code'                      => 'favorit',
                'student_limit'             => 500,
                'price'                     => 299000.00,
                'attendance_enabled'        => true,
                'parent_monitoring_enabled' => true,
                'notification_enabled'      => true,
                'is_active'                 => true,
            ],
            [
                'name'                      => 'Sekolah Excellence',
                'code'                      => 'excellence',
                'student_limit'             => 0,
                'price'                     => 599000.00,
                'attendance_enabled'        => true,
                'parent_monitoring_enabled' => true,
                'notification_enabled'      => true,
                'is_active'                 => true,
            ],
        ];

        foreach ($plans as $plan) {
            DB::table('plans')->updateOrInsert(
                ['code' => $plan['code']],
                array_merge($plan, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}
