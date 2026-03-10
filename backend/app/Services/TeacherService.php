<?php

namespace App\Services;

use App\Repositories\TeacherAssignmentRepository;
use App\Repositories\TeacherRepository;
use App\Repositories\TenantUserRepository;
use App\Repositories\UserRepository;
use App\Repositories\ClassroomRepository;
use Illuminate\Support\Facades\DB;

class TeacherService
{
    public function __construct(
        private UserRepository $userRepo,
        private TeacherRepository $teacherRepo,
        private ClassroomRepository $classroomRepo,
        private TeacherAssignmentRepository $assignmentRepo,
        private TenantUserRepository $tenantUserRepo,
    ) {}

    public function getAll()
    {
        return $this->teacherRepo->all();
    }

    public function getByTenant(int $tenantId)
    {
        return $this->teacherRepo->getByTenant($tenantId);
    }

    public function getByPublicId(string $publicId)
    {
        return $this->teacherRepo->getByPublicId($publicId);
    }

    public function createWithUser(array $data)
    {
        if (!empty($data['tenant_id'])) {
            $tenant = \App\Models\Tenant::find($data['tenant_id']);
            if ($tenant) {
                $subscription = $tenant->subscriptions()->with('plan')->where('is_active', true)->first();
                $teacherLimit = $subscription ? $subscription->plan->teacher_limit : null;

                if ($teacherLimit !== null) {
                    $currentCount = $this->teacherRepo->getByTenant($tenant->id)->count();
                    if ($currentCount >= $teacherLimit) {
                        throw new \InvalidArgumentException("Batas limit guru ({$teacherLimit}) telah tercapai untuk paket langganan Anda.");
                    }
                }
            }
        }

        return DB::transaction(function () use ($data) {
            $user = $this->userRepo->create([
                'name'     => $data['name'],
                'email'    => $data['email'],
                'password' => bcrypt(empty($data['nip']) ? 'mosikola@1234' : $data['nip']),
            ], 'teacher');

            $tenantId = $data['tenant_id'] ?? null;

            if ($tenantId) {
                $this->tenantUserRepo->create([
                    'tenant_id' => $tenantId,
                    'user_id'   => $user->id,
                    'role'      => 'teacher',
                    'is_active' => true,
                ]);
            }

            return $this->teacherRepo->create([
                'user_id'   => $user->id,
                'tenant_id' => $tenantId,
                'nip'       => empty($data['nip']) ? null : $data['nip'],
                'name'      => $data['name'],
            ]);
        });
    }

    public function update(string $publicId, array $data)
    {
        $teacher = $this->teacherRepo->getByPublicId($publicId);
        if (!$teacher) return null;

        return $this->teacherRepo->update($teacher, $data);
    }

    public function delete(string $publicId): bool
    {
        $teacher = $this->teacherRepo->getByPublicId($publicId);
        if (!$teacher) return false;

        $this->teacherRepo->delete($teacher);
        return true;
    }

    /**
     * Create a user account and attach it to an existing teacher (user_id = null).
     * Throws \InvalidArgumentException if the teacher already has a user.
     */
    public function attachUser(string $publicId, string $email, string $password): array
    {
        $teacher = $this->teacherRepo->getByPublicId($publicId);
        abort_if(!$teacher, 404, 'Guru tidak ditemukan.');

        if ($teacher->user_id) {
            throw new \InvalidArgumentException('Guru ini sudah memiliki akun login.');
        }

        return DB::transaction(function () use ($teacher, $email, $password) {
            $user = $this->userRepo->create([
                'name'     => $teacher->name,
                'email'    => $email,
                'password' => bcrypt($password),
            ], 'teacher');

            if ($teacher->tenant_id) {
                $this->tenantUserRepo->create([
                    'tenant_id' => $teacher->tenant_id,
                    'user_id'   => $user->id,
                    'role'      => 'teacher',
                    'is_active' => true,
                ]);
            }

            $this->teacherRepo->update($teacher, ['user_id' => $user->id]);

            return ['email' => $email];
        });
    }

    /**
     * Link an already-existing user account to a teacher that has no user.
     * Creates the tenant_user relationship if it doesn't already exist.
     */
    public function linkExistingUser(string $publicId, int $userId): array
    {
        $teacher = $this->teacherRepo->getByPublicId($publicId);
        abort_if(!$teacher, 404, 'Guru tidak ditemukan.');

        if ($teacher->user_id) {
            throw new \InvalidArgumentException('Guru ini sudah memiliki akun login.');
        }

        $user = \App\Models\User::findOrFail($userId);

        return DB::transaction(function () use ($teacher, $user) {
            // Ensure tenant_user record exists
            if ($teacher->tenant_id) {
                $this->tenantUserRepo->firstOrCreate([
                    'tenant_id' => $teacher->tenant_id,
                    'user_id'   => $user->id,
                ], [
                    'role'      => 'teacher',
                    'is_active' => true,
                ]);
            }

            $this->teacherRepo->update($teacher, ['user_id' => $user->id]);

            return ['email' => $user->email];
        });
    }

    // --- Assignment methods ---

    public function getAssignments(string $teacherPublicId, ?int $academicYearId = null)
    {
        $teacher = $this->teacherRepo->getByPublicId($teacherPublicId);
        if (!$teacher) return null;

        return $this->assignmentRepo->getByTeacher($teacher->id, $academicYearId);
    }

    public function addAssignment(string $teacherPublicId, array $data)
    {
        $teacher = $this->teacherRepo->getByPublicId($teacherPublicId);
        if (!$teacher) return null;

        $classroom = $this->classroomRepo->getByPublicId($data['classroom_id']);
        if (!$classroom) return null;

        $academicYearId = $data['academic_year_id'];
        $type = $data['assignment_type'];

        // Uniqueness enforcement
        if ($type === 'wali_kelas') {
            if ($this->assignmentRepo->existsWaliKelas($classroom->id, $academicYearId)) {
                throw new \InvalidArgumentException(
                    'Kelas ini sudah memiliki wali kelas untuk tahun ajaran tersebut.'
                );
            }
        }

        if ($type === 'guru_mapel') {
            $subject = trim($data['subject'] ?? '');
            if (!$subject) {
                throw new \InvalidArgumentException('Mata pelajaran wajib diisi untuk guru mapel.');
            }
            if ($this->assignmentRepo->existsGuruMapel($classroom->id, $academicYearId, $subject)) {
                throw new \InvalidArgumentException(
                    "Mata pelajaran '{$subject}' sudah memiliki guru untuk kelas ini."
                );
            }
        }

        return $this->assignmentRepo->create([
            'teacher_id'       => $teacher->id,
            'classroom_id'     => $classroom->id,
            'tenant_id'        => $teacher->tenant_id,
            'academic_year_id' => $academicYearId,
            'assignment_type'  => $type,
            'subject'          => $data['subject'] ?? null,
        ]);
    }

    public function removeAssignment(string $teacherPublicId, int $assignmentId): bool
    {
        $teacher = $this->teacherRepo->getByPublicId($teacherPublicId);
        if (!$teacher) return false;

        $assignment = $this->assignmentRepo->findById($assignmentId);
        if (!$assignment || $assignment->teacher_id !== $teacher->id) return false;

        $this->assignmentRepo->delete($assignment);
        return true;
    }
}
