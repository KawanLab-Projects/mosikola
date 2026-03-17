<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class InitialUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create an initial superadmin user
        $superadmin = \App\Models\User::create([
            'name' => 'Kawan Lab',
            'email' => 'info.kawanlab@gmail.com',
            'password' => bcrypt('1@Password'),
        ]);

        $superadmin->assignRole('superadmin');
    }
}
