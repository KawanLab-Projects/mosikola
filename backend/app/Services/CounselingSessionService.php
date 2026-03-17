<?php

namespace App\Services;

use App\Repositories\CounselingSessionRepository;

class CounselingSessionService
{
    protected $repository;

    public function __construct(CounselingSessionRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Get counseling sessions for a user based on their assigned classrooms
     */
    public function getSessionsForTeacher($user, $perPage = 15)
    {
        // Must be a guru_bk
        $classroomIds = $this->getAssignedClassroomIds($user);

        if (empty($classroomIds)) {
            // Return empty paginator if no classes assigned
            return app(\Illuminate\Pagination\LengthAwarePaginator::class, [
                'items' => [],
                'total' => 0,
                'perPage' => $perPage,
            ]);
        }

        return $this->repository->getByClassroomIds($classroomIds, $perPage);
    }

    public function getSession($id)
    {
        return $this->repository->find($id);
    }

    public function createSession(array $data)
    {
        return $this->repository->create($data);
    }

    public function updateSession($id, array $data)
    {
        return $this->repository->update($id, $data);
    }

    public function deleteSession($id)
    {
        return $this->repository->delete($id);
    }

    /**
     * Helper to get classroom IDs assigned to this teacher as guru_bk
     */
    private function getAssignedClassroomIds($user)
    {
        if (! $user->teacher || ! $user->teacher->assignments) {
            return [];
        }

        return $user->teacher->assignments
            ->where('assignment_type', 'guru_bk')
            ->pluck('classroom_id')
            ->filter()
            ->unique()
            ->values()
            ->toArray();
    }
}
