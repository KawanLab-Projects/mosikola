<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\AttendanceRepository;
use App\Repositories\AttendanceTokenRepository;
use App\Repositories\StudentRepository;
use Carbon\Carbon;
use Carbon\CarbonPeriod as Period;

enum AttendanceResult: string
{
    case ALREADY_ATTENDED = 'already_attended';
    case ATTENDANCE_RECORDED = 'attendance_recorded';
    case INVALID_TOKEN = 'token_is_invalid';
}

class AttendanceService
{
    public function __construct(private AttendanceRepository $attendanceRepo, private StudentRepository $studentRepo, private AttendanceTokenRepository $attendanceTokenRepo) {}

    public function processQrAttendance(string $qrToken, int $tenantId): array
    {
        // Decode the QR Token assuming format: base64(payload).signature
        // For simplicity, let's just validate it's in the attendance_tokens table
        // and hasn't expired.
        // In a real app we'd verify HMAC signature

        $tokenRecord = $this->attendanceTokenRepo->validateToken($qrToken);
        if (!$tokenRecord) {
            return ['status' => 'error', 'message' => 'Invalid or expired QR token'];
        }

        return ['status' => 'success', 'message' => 'Valid token'];
    }

    public function processNfcAttendance(string $nfcUid, int $tenantId): array
    {
        $student = \App\Models\Student::where('nfc_uid', $nfcUid)->where('tenant_id', $tenantId)->first();
        if (!$student) {
            return ['status' => 'error', 'message' => 'NFC Card not recognized'];
        }

        return $this->recordCheckInOut($student, $tenantId, 'nfc');
    }

    public function processStudentQrScan(User $studentUser, string $qrToken, int $tenantId): array
    {
        if (!$this->attendanceTokenRepo->validateToken($qrToken)) {
            return ['status' => 'error', 'message' => 'Invalid or expired QR tag'];
        }
        $student = $this->studentRepo->getByUserId($studentUser->id);
        if (!$student) {
            return ['status' => 'error', 'message' => 'Student record not found'];
        }
        return $this->recordCheckInOut($student, $tenantId, 'qr');
    }

    public function processCameraNisnAttendance(string $nisn, int $tenantId): array
    {
        $student = \App\Models\Student::where('nisn', $nisn)
            ->where('tenant_id', $tenantId)
            ->first();

        if (!$student) {
            return ['status' => 'error', 'message' => 'Student NISN not recognized'];
        }

        // Use 'barcode' or 'qr' as the method string
        return $this->recordCheckInOut($student, $tenantId, 'barcode');
    }

    public function batchAttendance(array $records, int $tenantId): array
    {
        $results = [];
        foreach ($records as $record) {
            $student = \App\Models\Student::where('id', $record['student_id'])
                ->where('tenant_id', $tenantId)
                ->first();

            if (!$student) {
                $results[] = ['status' => 'error', 'message' => "Student #{$record['student_id']} not found"];
                continue;
            }

            $timestamp = isset($record['timestamp']) ? Carbon::parse($record['timestamp'])->setTimezone(config('app.timezone')) : now();
            $results[] = $this->recordCheckInOut($student, $tenantId, $record['method'] ?? 'offline', $timestamp);
        }

        return $results;
    }

    private function recordCheckInOut($student, $tenantId, $method, $at = null): array
    {
        $at = $at ?: now();
        $today = $at->toDateString();
        $attendance = $this->attendanceRepo->getStudentAttendanceOnDate($student->id, $today);

        $schoolStartTime = \App\Models\TenantSetting::getValue($tenantId, 'attendance', 'school_start_time', '07:00');
        $schoolEndTime = \App\Models\TenantSetting::getValue($tenantId, 'attendance', 'school_end_time', '14:00');
        
        $currentTime = $at->format('H:i');
        $isAfterSchool = $currentTime >= $schoolEndTime;

        if (!$isAfterSchool) {
            // Check-in Phase
            $hasCheckedIn = \App\Models\Attendance::where('student_id', $student->id)
                ->whereDate('attendance_date', $today)
                ->where('type', 'check_in')
                ->exists();

            if ($hasCheckedIn) {
                return ['status' => 'warning', 'message' => 'Sudah melakukan absensi masuk hari ini.'];
            }

            $isLate = $currentTime > $schoolStartTime ? 'terlambat' : 'hadir';

            $this->attendanceRepo->create([
                'student_id' => $student->id,
                'tenant_id' => $tenantId,
                'attendance_date' => $today,
                'attended_at' => $at,
                'type' => 'check_in',
                'status' => $isLate,
                'method' => $method,
                'academic_year_id' => $student->classroom->academic_year_id ?? null,
            ]);

            return [
                'status' => 'success',
                'type' => 'check_in',
                'student' => $student->name,
                'attendance_status' => $isLate
            ];
        } else {
            // Check-out Phase
            $hasCheckedOut = \App\Models\Attendance::where('student_id', $student->id)
                ->whereDate('attendance_date', $today)
                ->where('type', 'check_out')
                ->exists();

            if ($hasCheckedOut) {
                return ['status' => 'warning', 'message' => 'Sudah melakukan absensi pulang hari ini.'];
            }

            $this->attendanceRepo->create([
                'student_id' => $student->id,
                'tenant_id' => $tenantId,
                'attendance_date' => $today,
                'attended_at' => $at,
                'type' => 'check_out',
                'status' => 'hadir',
                'method' => $method,
                'academic_year_id' => $student->classroom->academic_year_id ?? null,
            ]);

            return [
                'status' => 'success',
                'type' => 'check_out',
                'student' => $student->name,
                'attendance_status' => 'hadir'
            ];
        }
    }

    public function getLateArrival(
        string $date,
        string $limitTime
    ): array {

        $attendances = $this->attendanceRepo
            ->getLateArrival($date, $limitTime);

        return [
            'meta' => [
                'tanggal'    => $date,
                'timezone'   => config('app.timezone'),
                'jam_cek'    => $limitTime,
                'total_data' => $attendances->count(),
            ],
            'data' => $attendances->map(function ($attendance) use ($date, $limitTime) {
                $batas = Carbon::parse($date . ' ' . $limitTime);
                $attendedAt = Carbon::parse($attendance->attended_at);

                return [
                    'presensi_id' => $attendance->public_id,
                    'jam_masuk'   => $attendedAt->format('H:i'),
                    'terlambat' => $attendance->terlambat,

                    'siswa' => [
                        'id'    => $attendance->student->id,
                        'nisn'   => $attendance->student->nisn,
                        'nama'  => $attendance->student->name,
                        'kelas' => $attendance->student->classroom->name,
                    ],

                    'wali_kelas' => [
                        'nama' => $attendance->student->classroom->teacher->name,
                        'no_wa' => '085370244364',
                    ],

                    'orang_tua' => [
                        'nama'     => $attendance->student->parent_name,
                        'no_wa'    => $attendance->student->parent_phone,
                    ],
                ];
            })->values()
        ];
    }

    public function getStudentAttendances(string $parentPhone)
    {
        $students = $this->studentRepo->getByParentPhone($parentPhone);

        if ($students->isEmpty()) {
            return collect();
        }

        $start = Carbon::now()->startOfMonth();
        $end   = Carbon::now()->endOfMonth();

        $attendances = $this->attendanceRepo->getByStudentIdsAndMonth(
            $students->pluck('id')->toArray(),
            $start,
            $end
        );

        return $students->map(function ($student) use ($attendances) {
            return [
                'student_id'   => $student->public_id,
                'student_name' => $student->name,
                'attendances'  => $attendances->get($student->id, collect())
                    ->map(fn($attendance) => [
                        'presensi_id'     => $attendance->public_id,
                        'tanggal'         => $attendance->attended_at->format('Y-m-d'),
                        'jam_masuk'       => $attendance->attended_at->format('H:i'),
                        'terlambat' => number_format($attendance->terlambat, 0),
                        'ortu' => [
                            'nama' => $student->parent_name,
                            'no_wa' => $student->parent_phone,
                        ]
                    ]),
            ];
        });
    }

    public function getAttendanceHistory(User $user)
    {
        $student = $this->studentRepo->getByUserId($user->id);

        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();

        // Ambil absen, lalu index berdasarkan tanggal
        // Ambil data absensi yang ada
        $attendances = $this->attendanceRepo
            ->getByStudentIdsAndMonth([$student->id], $startOfMonth, $endOfMonth)
            ->keyBy(
                fn($item) =>
                Carbon::parse($item->attendance_date)->format('Y-m-d')
            );

        $history = collect();

        foreach (Period::create($startOfMonth, $endOfMonth) as $date) {
            $tanggal = $date->format('Y-m-d');

            if ($attendance = $attendances->get($tanggal)) {
                $history->push([
                    'tanggal'         => $tanggal,
                    'jam_masuk'       => $attendance->attended_at->format('H:i'),
                    'terlambat_menit' => $attendance->terlambat_menit,
                ]);
            } else {
                $history->push([
                    'tanggal'         => $tanggal,
                    'jam_masuk'       => '-',
                    'terlambat_menit' => null,
                ]);
            }
        }

        return $history;
    }
}
