<?php

namespace App\Repositories;

use App\Models\AttendanceToken;
use Carbon\Carbon;
use Illuminate\Support\Str;

interface AttendanceTokenRepoInterface
{
    public function generateToken(): AttendanceToken;
    public function validateToken($token): bool;
    public function getLastToken(): ?AttendanceToken;
    public function removeOldTokens(): void;
}

class AttendanceTokenRepository implements AttendanceTokenRepoInterface
{
    public function generateToken(): AttendanceToken
    {
        return AttendanceToken::create([
            'token' => Str::uuid(),
            'expires_at' => Carbon::now()->addSecond(20)
        ]);
    }

    public function getLastToken(): ?AttendanceToken
    {
        $lastToken = AttendanceToken::latest()->first();
        if (!$lastToken) {
            return $this->generateToken();
        }

        return $lastToken;
    }

    public function validateToken($token): bool
    {
        return AttendanceToken::where('token', $token)
            ->where('expires_at', '>', now())
            ->exists();
    }

    public function removeOldTokens(): void
    {
        AttendanceToken::where('expires_at', '<', now()->subMinute(5))->delete();
    }
}
