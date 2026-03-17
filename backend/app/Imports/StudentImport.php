<?php

namespace App\Imports;

use App\Models\Student;
use App\Models\Tenant;
use App\Services\StudentService;
use Maatwebsite\Excel\Concerns\OnEachRow;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Row;

class StudentImport implements OnEachRow, WithHeadingRow
{
    private ?int $limit = null;

    private int $currentCount = 0;

    private int $importedCount = 0;

    public function __construct(
        private StudentService $studentService,
        private int $classroomId,
        private ?int $tenantId = null
    ) {
        if ($this->tenantId) {
            $tenant = Tenant::find($this->tenantId);
            if ($tenant && $tenant->student_limit > 0) {
                $this->limit = $tenant->student_limit;
                $this->currentCount = Student::where('tenant_id', $this->tenantId)->count();
            }
        }
    }

    public function onRow(Row $row): void
    {
        if ($this->limit !== null && ($this->currentCount + $this->importedCount) >= $this->limit) {
            if ($this->importedCount > 0) {
                throw new \InvalidArgumentException("Batas limit siswa ({$this->limit}) tercapai. {$this->importedCount} siswa berhasil diimpor sebagian.");
            } else {
                throw new \InvalidArgumentException("Batas limit siswa ({$this->limit}) telah tercapai. Tidak ada siswa yang dapat ditambahkan.");
            }
        }

        $this->studentService->createWithUser([
            'nisn' => $row['nisn'],
            'name' => $row['name'],
            'address' => $row['address'] ?? null,
            'birth_place' => $row['birth_place'] ?? null,
            'birth_date' => $row['birth_date'] ?? null,
            'parent_name' => $row['parent_name'] ?? null,
            'parent_phone' => $row['parent_phone'] ?? null,
            'classroom_id' => $this->classroomId,
            'tenant_id' => $this->tenantId,
        ]);

        $this->importedCount++;
    }
}
