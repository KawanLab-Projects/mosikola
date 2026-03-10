<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\GlobalSetting;

class GlobalSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            ['key' => 'n8n_webhook_teacher_reminder', 'value' => null],
            ['key' => 'n8n_webhook_student_late_homeroom', 'value' => null],
            ['key' => 'n8n_webhook_student_late_parent', 'value' => null],
            ['key' => 'n8n_webhook_student_growth', 'value' => null],
        ];

        foreach ($settings as $setting) {
            GlobalSetting::updateOrCreate(
                ['key' => $setting['key']],
                ['value' => $setting['value']]
            );
        }
    }
}
