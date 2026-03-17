<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Teacher extends Model
{
    protected $fillable = [
        'public_id',
        'name',
        'user_id',
        'tenant_id',
        'nip',
    ];

    protected $hidden = ['id', 'user_id'];

    protected $appends = ['has_user', 'email'];

    public function getHasUserAttribute(): bool
    {
        return ! is_null($this->user_id);
    }

    public function getEmailAttribute(): ?string
    {
        return $this->user?->email;
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function assignments()
    {
        return $this->hasMany(TeacherAssignment::class);
    }

    public function guruWaliStudents()
    {
        return $this->hasMany(GuruWaliStudent::class);
    }

    public function developmentNotes()
    {
        return $this->hasMany(StudentDevelopmentNote::class);
    }
}
