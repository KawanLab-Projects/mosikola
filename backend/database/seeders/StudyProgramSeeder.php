<?php

namespace Database\Seeders;

use App\Models\StudyProgram;
use Illuminate\Database\Seeder;

class StudyProgramSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        StudyProgram::create([
            'name' => 'Rekayasa Perangkat Lunak',
            'short' => 'RPL',
        ]);

        StudyProgram::create([
            'name' => 'Teknik Komputer dan Jaringan',
            'short' => 'TKJ',
        ]);
    }
}
