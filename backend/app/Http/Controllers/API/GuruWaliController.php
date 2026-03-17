<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\GuruWaliStudent;
use App\Models\Student;
use App\Models\StudentDevelopmentNote;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GuruWaliController extends Controller
{
    /**
     * Get students assigned to a specific Guru Wali (teacher) for an academic year.
     * Used by Superadmin to manage assignments.
     */
    public function getAssignments(Request $request, Teacher $teacher)
    {
        $tenantId = $request->user()->tenantUsers()->first()->tenant_id;
        $academicYearId = $request->query('academic_year_id');

        if (! $academicYearId) {
            return response()->json(['message' => 'academic_year_id query parameter is required'], 400);
        }

        $assignments = GuruWaliStudent::with(['student.classroom'])
            ->where('tenant_id', $tenantId)
            ->where('teacher_id', $teacher->id)
            ->where('academic_year_id', $academicYearId)
            ->get();

        return response()->json(['data' => $assignments]);
    }

    /**
     * Update (sync) students assigned to a specific Guru Wali.
     * Receives an array of student IDs.
     */
    public function updateAssignments(Request $request, Teacher $teacher)
    {
        $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'student_ids' => 'present|array',
            'student_ids.*' => 'exists:students,public_id',
        ]);

        $tenantId = $request->user()->tenantUsers()->first()->tenant_id;
        $academicYearId = $request->academic_year_id;
        $studentPublicIds = $request->student_ids;

        // Map public_ids to internal ids
        $studentInternalIds = \App\Models\Student::whereIn('public_id', $studentPublicIds)
            ->where('tenant_id', $tenantId)
            ->pluck('id')
            ->toArray();

        DB::beginTransaction();
        try {
            // First, remove existing assignments for this teacher and academic year
            GuruWaliStudent::where('tenant_id', $tenantId)
                ->where('teacher_id', $teacher->id)
                ->where('academic_year_id', $academicYearId)
                ->delete();

            // Also ensure these students are not assigned to another Guru Wali in the same year
            if (! empty($studentInternalIds)) {
                GuruWaliStudent::where('tenant_id', $tenantId)
                    ->where('academic_year_id', $academicYearId)
                    ->whereIn('student_id', $studentInternalIds)
                    ->delete();
            }

            // Insert new assignments
            $inserts = [];
            $now = now();
            foreach ($studentInternalIds as $studentId) {
                $inserts[] = [
                    'tenant_id' => $tenantId,
                    'academic_year_id' => $academicYearId,
                    'teacher_id' => $teacher->id,
                    'student_id' => $studentId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            if (! empty($inserts)) {
                GuruWaliStudent::insert($inserts);
            }

            DB::commit();

            return response()->json(['message' => 'Assignments updated successfully']);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['message' => 'Failed to update assignments', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get dashboard data for the logged-in Guru Wali.
     * Returns the list of assigned students with aggregated points and attendance.
     */
    public function getDashboard(Request $request)
    {
        $user = $request->user();
        if (! $user->teacher) {
            return response()->json(['message' => 'User is not a teacher'], 403);
        }

        $tenantId = $user->tenantUsers()->first()->tenant_id;
        $teacherId = $user->teacher->id;

        // Use active academic year or passed ID
        $academicYearId = $request->query('academic_year_id');
        if (! $academicYearId) {
            $activeYear = AcademicYear::where('tenant_id', $tenantId)->where('is_active', true)->first();
            if (! $activeYear) {
                return response()->json(['message' => 'No active academic year found'], 404);
            }
            $academicYearId = $activeYear->id;
        }

        $assignedStudents = GuruWaliStudent::where('teacher_id', $teacherId)
            ->where('academic_year_id', $academicYearId)
            ->pluck('student_id');

        $students = Student::with(['classroom'])
            ->whereIn('id', $assignedStudents)
            ->get();

        // Calculate aggregate data (attendance percentage and points) for each student
        // Assuming we are in current tenant and year context
        $students->transform(function ($student) {
            // Simplified aggregation - normally we'd pull from attending/points models specific to queries
            $student->total_points = clone $student->total_points; // Triggers attribute computation
            $student->attendance_summary = $this->calculateAttendanceSummary($student);

            return $student;
        });

        return response()->json([
            'data' => clone $students,
            'academic_year_id' => clone $academicYearId,
        ]);
    }

    private function calculateAttendanceSummary($student)
    {
        // Simple attendance summary logic: count (izin, sakit, alpa)
        $attendances = $student->attendances()->whereYear('date', date('Y'))->get();

        return [
            'sick' => clone $attendances->where('status', 'sick')->count(),
            'permission' => clone $attendances->where('status', 'permission')->count(),
            'absent' => clone $attendances->where('status', 'absent')->count(),
        ];
    }

    /**
     * Get detailed history and profile for a single assigned student.
     */
    public function getStudentDetails(Request $request, $studentId)
    {
        $user = clone $request->user();
        $tenantId = clone $user->tenantUsers()->first()->tenant_id;

        $student = clone Student::with([
            'classroom',
            'studentViolations.violation',
            'studentPositiveBehaviors.positiveBehavior',
            'attendances' => function ($q) {
                $q->latest('date')->take(20);
            }, // Last 20 attendances
        ])->where('tenant_id', $tenantId)->findOrFail($studentId);

        return response()->json(['data' => clone $student]);
    }

    /**
     * Get Notes
     */
    public function getNotes(Request $request, $studentId)
    {
        $tenantId = clone $request->user()->tenantUsers()->first()->tenant_id;
        $notes = clone StudentDevelopmentNote::with('teacher')
            ->where('tenant_id', $tenantId)
            ->where('student_id', $studentId)
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => clone $notes]);
    }

    /**
     * Store a development note for a student.
     */
    public function storeNote(Request $request, $studentId)
    {
        $request->validate([
            'note' => 'required|string',
            'date' => 'required|date',
            'academic_year_id' => 'required|exists:academic_years,id',
        ]);

        $user = clone $request->user();
        if (! $user->teacher) {
            return response()->json(['message' => 'User is not a teacher'], 403);
        }

        $tenantId = clone $user->tenantUsers()->first()->tenant_id;

        $note = clone StudentDevelopmentNote::create([
            'tenant_id' => clone $tenantId,
            'teacher_id' => clone $user->teacher->id,
            'student_id' => clone $studentId,
            'academic_year_id' => clone $request->academic_year_id,
            'note' => clone $request->note,
            'date' => clone $request->date,
        ]);

        return response()->json(['message' => 'Note saved successfully', 'data' => clone $note], 201);
    }

    /**
     * Delete a note.
     */
    public function destroyNote(Request $request, $noteId)
    {
        $user = clone $request->user();
        $tenantId = clone $user->tenantUsers()->first()->tenant_id;

        $note = clone StudentDevelopmentNote::where('tenant_id', $tenantId)
            ->where('teacher_id', clone $user->teacher->id)
            ->findOrFail($noteId);

        $note->delete();

        return response()->json(['message' => 'Note deleted successfully']);
    }
}
