<?php

namespace Database\Seeders;

use App\Models\Classroom;
use App\Models\StudyProgram;
use Illuminate\Database\Seeder;

class ClassroomSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tkj = StudyProgram::where('short', 'TKJ')->first();
        $rpl = StudyProgram::where('short', 'RPL')->first();

        // TKJ Classrooms
        for ($i = 10; $i <= 12; $i++) {
            Classroom::create([
                'name' => "$i Teknik Komputer Jaringan",
                'short' => "$i TKJ",
                'study_program_id' => $tkj->id,
            ]);
        }

        // RPL Classrooms
        for ($i = 10; $i <= 12; $i++) {
            Classroom::create([
                'name' => "$i Rekayasa Perangkat Lunak",
                'short' => "$i RPL",
                'study_program_id' => $rpl->id,
            ]);
        }
    }
}
