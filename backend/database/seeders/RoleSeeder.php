<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Role::create(['name' => 'superadmin']); // Super Admin
        Role::create(['name' => 'admin']); // School Admin
        Role::create(['name' => 'teacher']);
        Role::create(['name' => 'student']);
    }
}
