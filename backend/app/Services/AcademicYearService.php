<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\Student;
use App\Models\StudentGradeLog;
use App\Models\Tenant;
use App\Repositories\Contracts\AcademicYearRepoInterface;
use Exception;
use Illuminate\Support\Facades\DB;

class AcademicYearService
{
    // Maps school_type → max grade level
    const GRADE_MAP = [
        'SD' => ['min' => 1, 'max' => 6],
        'MI' => ['min' => 1, 'max' => 6],
        'SMP' => ['min' => 7, 'max' => 9],
        'MTS' => ['min' => 7, 'max' => 9],
        'SMA' => ['min' => 10, 'max' => 12],
        'SMK' => ['min' => 10, 'max' => 12],
        'MAK' => ['min' => 10, 'max' => 12],
        'MA' => ['min' => 10, 'max' => 12],
    ];

    public function __construct(
        private AcademicYearRepoInterface $repo
    ) {}

    public function listByTenant(int $tenantId)
    {
        return $this->repo->findByTenant($tenantId);
    }

    public function getActive(int $tenantId): ?AcademicYear
    {
        return $this->repo->findActive($tenantId);
    }

    public function create(int $tenantId, array $data): AcademicYear
    {
        return $this->repo->create([
            'tenant_id' => $tenantId,
            'name' => $data['name'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'is_active' => false,
        ]);
    }

    public function activate(int $academicYearId, int $tenantId): AcademicYear
    {
        $year = $this->repo->findById($academicYearId);

        if (! $year || $year->tenant_id !== $tenantId) {
            throw new Exception('Tahun ajaran tidak ditemukan.');
        }

        $this->repo->setActive($academicYearId, $tenantId);

        return $year->refresh();
    }

    /**
     * Close the active academic year and auto-promote all students.
     * Final-grade students are archived. Attendance records are linked to this year.
     */
    public function closeYear(AcademicYear $year, Tenant $tenant, int $performedBy): void
    {
        if (! $year->is_active) {
            throw new Exception('Tahun ajaran ini tidak aktif.');
        }

        $schoolType = strtoupper($tenant->school_type ?? '');
        $gradeConfig = self::GRADE_MAP[$schoolType] ?? null;

        if (! $gradeConfig) {
            throw new Exception("Jenis sekolah '{$tenant->school_type}' tidak dikenali.");
        }

        DB::transaction(function () use ($year, $tenant, $performedBy, $gradeConfig) {
            $maxGrade = $gradeConfig['max'];

            // Fetch all active students belonging to this tenant's classrooms
            $students = Student::active()
                ->whereHas('classroom.studyProgram', fn ($q) => $q->where('tenant_id', $tenant->id))
                ->with('classroom')
                ->get();

            foreach ($students as $student) {
                $currentGrade = $student->classroom->grade_level;
                $fromClassroomId = $student->classroom_id;

                if ($currentGrade >= $maxGrade) {
                    // Archive final-grade students
                    $student->update(['status' => 'archived']);

                    StudentGradeLog::create([
                        'student_id' => $student->id,
                        'academic_year_id' => $year->id,
                        'from_classroom_id' => $fromClassroomId,
                        'to_classroom_id' => null,
                        'action' => 'archived',
                        'performed_by' => $performedBy,
                    ]);
                } else {
                    // Promote: find classroom with grade_level + 1
                    // If school has jurusan, match within same study_program
                    $studyProgramId = $student->classroom->study_program_id;

                    $nextClassroom = Classroom::where('grade_level', $currentGrade + 1)
                        ->when(
                            $studyProgramId,
                            fn ($q) => $q->where('study_program_id', $studyProgramId),
                            fn ($q) => $q->whereNull('study_program_id') // SD/SMP: no jurusan
                        )
                        ->first();

                    if ($nextClassroom) {
                        $student->update(['classroom_id' => $nextClassroom->id]);

                        StudentGradeLog::create([
                            'student_id' => $student->id,
                            'academic_year_id' => $year->id,
                            'from_classroom_id' => $fromClassroomId,
                            'to_classroom_id' => $nextClassroom->id,
                            'action' => 'promoted',
                            'performed_by' => $performedBy,
                        ]);
                    }
                }
            }

            // Archive all attendance records under this academic year
            Attendance::whereHas('student.classroom.studyProgram', fn ($q) => $q->where('tenant_id', $tenant->id))
                ->whereNull('academic_year_id')
                ->update(['academic_year_id' => $year->id]);

            // Mark year as closed (inactive)
            $year->update(['is_active' => false]);
        });
    }

    /**
     * Demote a student back to a lower-grade classroom (admin correction).
     */
    public function demoteStudent(Student $student, Classroom $toClassroom, int $academicYearId, int $performedBy): void
    {
        $fromClassroomId = $student->classroom_id;

        DB::transaction(function () use ($student, $toClassroom, $academicYearId, $fromClassroomId, $performedBy) {
            $student->update(['classroom_id' => $toClassroom->id]);

            StudentGradeLog::create([
                'student_id' => $student->id,
                'academic_year_id' => $academicYearId,
                'from_classroom_id' => $fromClassroomId,
                'to_classroom_id' => $toClassroom->id,
                'action' => 'demoted',
                'performed_by' => $performedBy,
            ]);
        });
    }
}
