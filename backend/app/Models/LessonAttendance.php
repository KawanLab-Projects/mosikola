<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonAttendance extends Model
{
    protected $fillable = [
        'lesson_journal_id',
        'student_id',
        'status',
        'notes',
    ];

    public function lessonJournal(): BelongsTo
    {
        return $this->belongsTo(LessonJournal::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
