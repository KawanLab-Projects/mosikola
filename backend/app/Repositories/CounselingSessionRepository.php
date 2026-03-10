<?php

namespace App\Repositories;

use App\Models\CounselingSession;

class CounselingSessionRepository
{
    /**
     * Get counseling sessions for specific classrooms
     */
    public function getByClassroomIds(array $classroomIds, $perPage = 15)
    {
        return CounselingSession::with(['student', 'teacher'])
            ->whereHas('student', function ($query) use ($classroomIds) {
                $query->whereIn('classroom_id', $classroomIds);
            })
            ->orderBy('counseling_date', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get a specific counseling session
     */
    public function find($id)
    {
        return CounselingSession::with(['student', 'teacher'])->findOrFail($id);
    }

    /**
     * Create a new counseling session
     */
    public function create(array $data)
    {
        return CounselingSession::create($data);
    }

    /**
     * Update an existing counseling session
     */
    public function update($id, array $data)
    {
        $session = $this->find($id);
        $session->update($data);
        return $session;
    }

    /**
     * Delete a counseling session
     */
    public function delete($id)
    {
        $session = $this->find($id);
        return $session->delete();
    }
}
