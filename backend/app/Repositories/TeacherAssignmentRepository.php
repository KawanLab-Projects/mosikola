<?php

namespace App\Repositories;

use App\Models\TeacherAssignment;
use Illuminate\Support\Collection;

interface TeacherAssignmentRepoInterface
{
    public function getByTeacher(int $teacherId, ?int $academicYearId): Collection;

    public function getByClassroom(int $classroomId, int $academicYearId): Collection;

    public function findById(int $id): ?TeacherAssignment;

    public function create(array $data): TeacherAssignment;

    public function delete(TeacherAssignment $assignment): void;

    public function existsWaliKelas(int $classroomId, int $academicYearId): bool;

    public function existsGuruMapel(int $classroomId, int $academicYearId, string $subject): bool;
}

class TeacherAssignmentRepository implements TeacherAssignmentRepoInterface
{
    public function getByTeacher(int $teacherId, ?int $academicYearId): Collection
    {
        return TeacherAssignment::where('teacher_id', $teacherId)
            ->when($academicYearId, fn ($q) => $q->where('academic_year_id', $academicYearId))
            ->with(['classroom', 'academicYear'])
            ->orderBy('assignment_type')
            ->get();
    }

    public function getByClassroom(int $classroomId, int $academicYearId): Collection
    {
        return TeacherAssignment::where('classroom_id', $classroomId)
            ->where('academic_year_id', $academicYearId)
            ->with(['teacher', 'academicYear'])
            ->get();
    }

    public function findById(int $id): ?TeacherAssignment
    {
        return TeacherAssignment::find($id);
    }

    public function create(array $data): TeacherAssignment
    {
        return TeacherAssignment::create($data);
    }

    public function delete(TeacherAssignment $assignment): void
    {
        $assignment->delete();
    }

    public function existsWaliKelas(int $classroomId, int $academicYearId): bool
    {
        return TeacherAssignment::where('classroom_id', $classroomId)
            ->where('academic_year_id', $academicYearId)
            ->where('assignment_type', 'wali_kelas')
            ->exists();
    }

    public function existsGuruMapel(int $classroomId, int $academicYearId, string $subject): bool
    {
        return TeacherAssignment::where('classroom_id', $classroomId)
            ->where('academic_year_id', $academicYearId)
            ->where('assignment_type', 'guru_mapel')
            ->where('subject', $subject)
            ->exists();
    }
}
