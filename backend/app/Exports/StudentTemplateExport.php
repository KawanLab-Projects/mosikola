<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithHeadings;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class StudentTemplateExport implements FromArray, WithHeadings, WithColumnFormatting
{
    public function headings(): array
    {
        return [
            'nisn',
            'name',
            'birth_place',
            'birth_date',
            'address',
            'parent_name',
            'parent_phone',
        ];
    }

    public function array(): array
    {
        return [
            [
                '0012345678',
                'Budi Santoso',
                'Jakarta',
                '2005-05-15',
                'Jl. Merdeka No. 123, Jakarta',
                'Agus Santoso',
                '081234567890',
            ],
            [
                '0012345679',
                'Siti Aminah',
                'Bandung',
                '2006-02-20',
                'Jl. Pahlawan No. 45, Bandung',
                'Ahmad Suryadi',
                '085612345678',
            ]
        ];
    }

    public function columnFormats(): array
    {
        return [
            'A:G' => NumberFormat::FORMAT_TEXT, // Change to A:G since there are 7 columns now
        ];
    }
}
