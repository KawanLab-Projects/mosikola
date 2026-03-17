<?php

namespace App\Services;

use App\Models\Violation;
use App\Repositories\ViolationRepository;
use Illuminate\Support\Collection;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ViolationService
{
    public function __construct(protected ViolationRepository $repo) {}

    public function getAll(int $tenantId): Collection
    {
        return $this->repo->getAllByTenant($tenantId);
    }

    public function create(int $tenantId, array $data): Violation
    {
        return $this->repo->create([
            'tenant_id' => $tenantId,
            'name' => $data['name'],
            'points' => $data['points'],
        ]);
    }

    /** Find a violation and abort with 403 if it does not belong to the tenant. */
    public function findOrFail403(int $id, int $tenantId): Violation
    {
        $violation = $this->repo->getById($id);

        abort_if(! $violation, 404, 'Jenis pelanggaran tidak ditemukan.');
        abort_if($violation->tenant_id !== $tenantId, 403, 'Akses ditolak.');

        return $violation;
    }

    public function update(Violation $violation, array $data): Violation
    {
        $this->repo->update($violation, $data);

        return $violation->fresh();
    }

    /** @throws HttpException 422 when violation is in use */
    public function delete(Violation $violation): void
    {
        abort_if(
            $this->repo->isUsedByStudentViolation($violation->id),
            422,
            'Tidak dapat menghapus jenis pelanggaran yang sudah terpakai oleh catatan siswa.'
        );

        $this->repo->delete($violation);
    }
}
