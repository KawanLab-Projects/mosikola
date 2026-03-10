<?php

namespace App\Services;

use App\Repositories\ClassroomRepository;
use App\Repositories\StudyProgramRepository;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class ClassroomService
{
    public function __construct(
        protected ClassroomRepository $classroomRepo,
        protected StudyProgramRepository $studyProgramRepo
    ) {}

    /** Get classrooms belonging to a specific study program (for SMK/SMA). */
    public function getAllByStudyProgram(string $studyProgramPublicId)
    {
        $studyProgram = $this->studyProgramRepo->getByPublicId($studyProgramPublicId);

        if (!$studyProgram) {
            throw new ModelNotFoundException("study program not found");
        }

        return $this->classroomRepo->getAllByStudyProgram($studyProgram->id);
    }

    /** Get classrooms belonging to a tenant directly (for SD/SMP that have no jurusan). */
    public function getAllByTenant(int $tenantId)
    {
        return $this->classroomRepo->getAllByTenant($tenantId);
    }

    public function getById(int $id)
    {
        return $this->classroomRepo->getById($id);
    }

    public function getByPublicId(string $public_id)
    {
        return $this->classroomRepo->getByPublicId($public_id);
    }

    /**
     * Store a classroom.
     * If study_program_public_id is provided → SMK/SMA mode.
     * Otherwise → SD/SMP mode (no jurusan).
     */
    public function store(array $data)
    {
        $studyProgramId = null;

        if (!empty($data['study_program_public_id'])) {
            $studyProgram = $this->studyProgramRepo->getByPublicId($data['study_program_public_id']);
            if (!$studyProgram) {
                throw new ModelNotFoundException("study program not found");
            }
            $studyProgramId = $studyProgram->id;
        }

        return $this->classroomRepo->create([
            'name'             => $data['name'],
            'short'            => $data['short'],
            'grade_level'      => $data['grade_level'],
            'study_program_id' => $studyProgramId,
            'tenant_id'        => $data['tenant_id'] ?? null,
        ]);
    }

    public function update(int $id, array $data)
    {
        if (array_key_exists('study_program_public_id', $data)) {
            if (!empty($data['study_program_public_id'])) {
                $studyProgram = $this->studyProgramRepo->getByPublicId($data['study_program_public_id']);
                if (!$studyProgram) {
                    throw new ModelNotFoundException("Study program not found");
                }
                $data['study_program_id'] = $studyProgram->id;
            } else {
                $data['study_program_id'] = null;
            }
            unset($data['study_program_public_id']);
        }

        return $this->classroomRepo->update($id, $data);
    }

    public function delete(int $id)
    {
        return $this->classroomRepo->delete($id);
    }
}
