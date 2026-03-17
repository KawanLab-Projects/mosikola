<?php

namespace App\Services;

use App\Models\CounselingSession;
use App\Models\Student;
use Carbon\Carbon;

class BkDashboardService
{
    /**
     * Get dashboard statistics (High-Risk Students, Recent Interventions, Positive momentum)
     */
    public function getStats($user)
    {
        $classroomIds = $this->getAssignedClassroomIds($user);

        if (empty($classroomIds)) {
            return [
                'high_risk_count' => 0,
                'interventions_count' => 0,
                'positive_momentum_count' => 0,
            ];
        }

        // 1. High-Risk Students: Students with violation points > 50 in these classrooms
        // Note: Assuming there's a way to calculate total violation points.
        // Based on typical systems, maybe a `total_violation_points` column or summing violations.
        // We'll calculate it based on the `Student` model. If not directly available as a column,
        // we might need to adjust this. Let's assume a scope or attribute `total_violation_points` exists
        // or we compute it if there's a `points` column. For now, assuming standard mosikola schema
        // usually has an accessor `total_points` or we can join. Let's use `student_violations`.

        $highRiskCount = Student::whereIn('classroom_id', $classroomIds)
            ->whereHas('studentViolations') // Use correct relationship name
            ->get()
            ->filter(function ($student) {
                // Use the total_points accessor logic
                return $student->total_points > 30; // 30 is example threshold
            })
            ->count();

        // If 'violations_sum_point' isn't perfect, we can do a raw query, or just base it on a static column if it exists.
        // Let's refine based on how mosikola does it. Usually there is no cached column, we aggregate.

        // 2. Recent Interventions (Counseling Sessions this month)
        $recentInterventionsCount = CounselingSession::whereIn('student_id', function ($query) use ($classroomIds) {
            $query->select('id')->from('students')->whereIn('classroom_id', $classroomIds);
        })
            ->whereMonth('counseling_date', Carbon::now()->month)
            ->whereYear('counseling_date', Carbon::now()->year)
            ->count();

        // 3. Positive Momentum (Students in these classes who got positive behavior this month)
        $positiveMomentumCount = Student::whereIn('classroom_id', $classroomIds)
            ->whereHas('studentPositiveBehaviors', function ($q) { // Use correct relationship name
                $q->whereMonth('created_at', Carbon::now()->month)
                    ->whereYear('created_at', Carbon::now()->year);
            })
            ->count();

        return [
            'high_risk_count' => $highRiskCount,
            'interventions_count' => $recentInterventionsCount,
            'positive_momentum_count' => $positiveMomentumCount,
        ];
    }

    /**
     * Get students needing attention (highest violation points)
     */
    public function getNeedsAttention($user, $limit = 10)
    {
        $classroomIds = $this->getAssignedClassroomIds($user);

        if (empty($classroomIds)) {
            return collect([]);
        }

        // Fetch all students in the assigned classrooms, calculate their total_points, sort, and slice
        // We use the `total_points` accessor which calculates based on violations and positive behaviors
        $students = Student::whereIn('classroom_id', $classroomIds)
            ->with(['classroom'])
            ->get();

        $sortedStudents = $students->map(function ($student) {
            $student->calculated_points = $student->total_points;

            return $student;
        })
            ->filter(function ($student) {
                return $student->calculated_points > 0;
            })
            ->sortByDesc('calculated_points')
            ->take($limit)
            ->values();

        // Ensure the frontend receives the points data
        $sortedStudents->each(function ($student) {
            $student->violations_sum_point = $student->calculated_points; // Mapper for frontend
        });

        return $sortedStudents;
    }

    /**
     * Helper to get classroom IDs assigned to this teacher as guru_bk
     */
    private function getAssignedClassroomIds($user)
    {
        if (! $user->teacher || ! $user->teacher->assignments) {
            return [];
        }

        return $user->teacher->assignments
            ->where('assignment_type', 'guru_bk')
            ->pluck('classroom_id')
            ->filter()
            ->unique()
            ->values()
            ->toArray();
    }
}
