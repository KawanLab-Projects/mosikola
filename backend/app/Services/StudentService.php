<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\StudentRepository;
use App\Repositories\ClassroomRepository;
use App\Repositories\UserRepository;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use App\Imports\StudentImport;
use App\Models\Student;
use App\Models\Tenant;
use Maatwebsite\Excel\Facades\Excel;

class StudentService
{

    public function __construct(
        private UserRepository $userRepo,
        private StudentRepository $studentRepo,
        private ClassroomRepository $classroomRepo
    ) {}

    public function importFromExcel(
        string $classroomPublicId,
        \Illuminate\Http\UploadedFile $file,
        ?int $tenantId = null
    ): void {
        $classroom = $this->classroomRepo->getByPublicId($classroomPublicId);

        if (!$classroom) {
            throw new ModelNotFoundException('Classroom not found');
        }

        Excel::import(
            new StudentImport($this, $classroom->id, $tenantId),
            $file
        );
    }

    public function createWithUser(array $data)
    {
        if (!empty($data['tenant_id'])) {
            $tenant = Tenant::find($data['tenant_id']);
            if ($tenant) {
                $subscription = $tenant->subscriptions()->with('plan')->where('is_active', true)->first();
                $studentLimit = $subscription ? $subscription->plan->student_limit : null;

                if ($studentLimit !== null) {
                    $currentCount = $this->studentRepo->countByTenantId($tenant->id);
                    if ($currentCount >= $studentLimit) {
                        throw new \InvalidArgumentException("Batas limit siswa ({$studentLimit}) telah tercapai untuk paket langganan Anda.");
                    }
                }
            }
        }

        return DB::transaction(function () use ($data) {

            $user = $this->userRepo->create([
                'name'     => $data['nisn'],
                'email'    => $data['nisn'] . '@mosikola.com',
                'password' => bcrypt($data['nisn']),
            ], 'student');

            return $this->studentRepo->create([
                'user_id'      => $user->id,
                'tenant_id'    => $data['tenant_id'] ?? null,
                'nisn'         => $data['nisn'],
                'name'         => $data['name'],
                'address'      => $data['address'] ?? null,
                'birth_place'  => $data['birth_place'] ?? null,
                'birth_date'   => $data['birth_date'] ?? null,
                'parent_name'  => $data['parent_name'] ?? null,
                'parent_phone' => $data['parent_phone'] ?? null,
                'classroom_id' => $data['classroom_id'],
            ]);
        });
    }

    public function getStudentsByClassroom(string $classroomPublicId)
    {
        $classroom = $this->classroomRepo->getByPublicId($classroomPublicId);
        return $this->studentRepo->getByClassroomId($classroom->id);
    }

    public function getStudentsByTenant(int $tenantId)
    {
        return $this->studentRepo->getByTenantId($tenantId);
    }

    public function getById(int $id): ?Student
    {
        return $this->studentRepo->getById($id);
    }

    public function getByPublicId(string $public_id): ?Student
    {
        return $this->studentRepo->getByPublicId($public_id);
    }

    public function create(string $classroomPublicId, array $data, ?int $tenantId = null): Student
    {
        $classroom = $this->classroomRepo->getByPublicId($classroomPublicId);
        if (!$classroom) {
            throw new ModelNotFoundException("Classroom not found");
        }

        $data['classroom_id'] = $classroom->id;
        $data['tenant_id']    = $tenantId;

        return $this->createWithUser($data);
    }

    public function update(string $publicId, array $data): Student
    {
        $student = $this->getByPublicId($publicId);
        if (!$student) {
            throw new ModelNotFoundException("Student not found");
        }

        return $this->studentRepo->update($student, $data);
    }

    public function delete(string $publicId): void
    {
        $student = $this->getByPublicId($publicId);
        if (!$student) {
            throw new ModelNotFoundException("Student not found");
        }

        $this->studentRepo->delete($student);
    }
}
