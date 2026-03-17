<?php

namespace App\Services;

use App\Repositories\AttendanceTokenRepository;
use Carbon\Carbon;

class AttendanceTokenService
{
    public function __construct(private AttendanceTokenRepository $attendanceTokenRepo) {}

    public function getToken()
    {
        $lastToken = $this->attendanceTokenRepo->getLastToken();

        if ($lastToken->expires_at <= Carbon::now()) {
            $this->attendanceTokenRepo->removeOldTokens();

            return $this->attendanceTokenRepo->generateToken();
        }

        return $lastToken;
    }
}
