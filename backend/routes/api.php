<?php

use App\Http\Controllers\AcademicYearController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AttendanceTokenController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\ClassroomController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\StudyProgramController;
use App\Http\Controllers\ScheduleImportController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\SuperadminTenantController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\TenantRegistrationController;
use App\Http\Controllers\JournalMonitoringController;
use App\Http\Controllers\LessonJournalController;
use App\Http\Controllers\TenantSettingController;
use App\Http\Controllers\SchoolPeriodController;
use App\Http\Controllers\CurriculumItemController;
use App\Http\Controllers\TeacherUnavailabilityController;
use App\Http\Controllers\ScheduleGeneratorController;
use App\Http\Controllers\Superadmin\IdCardTemplateController;
use App\Http\Controllers\Superadmin\IdCardFulfillmentController;
use App\Http\Controllers\Superadmin\N8nSettingController;
use App\Http\Controllers\Superadmin\AiSettingController;
use App\Http\Controllers\API\AdminAttendanceController;
use App\Http\Controllers\API\AttendanceController as ApiAttendanceController;
use App\Http\Controllers\API\AttendanceTokenController as ApiAttendanceTokenController;
use App\Http\Controllers\API\IdCardOrderController;
use App\Http\Controllers\Dashboard\SuperadminDashboardController;
use App\Http\Controllers\SuperAdmin\PlanController;
use App\Http\Controllers\SuperAdmin\SubscriptionController;
use App\Http\Controllers\AiCounselingController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('auth/register', [TenantRegistrationController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('registrations', [TenantRegistrationController::class, 'index']);
    Route::post('registrations/{id}/approve', [TenantRegistrationController::class, 'approve']);
    Route::get('superadmin/tenants', [SuperadminTenantController::class, 'index']);
    Route::get('superadmin/dashboard-stats', [SuperadminDashboardController::class, 'getStats']);

    // Kartu Siswa Superadmin
    Route::apiResource('superadmin/id-card-templates', IdCardTemplateController::class);
    // Explicit POST route for file uploads (FormData with files can't use PUT directly on API routes)
    Route::post('superadmin/id-card-templates/{id}/upload', [IdCardTemplateController::class, 'update']);

    Route::get('superadmin/id-card-orders', [IdCardFulfillmentController::class, 'index']);
    Route::get('superadmin/id-card-orders/{id}/download', [IdCardFulfillmentController::class, 'downloadAssets']);
    Route::put('superadmin/id-card-orders/{id}', [IdCardFulfillmentController::class, 'update']);
    Route::apiResource('superadmin/plans', PlanController::class);
    Route::apiResource('superadmin/subscriptions', SubscriptionController::class)->only(['index', 'store', 'destroy']);

    // Automation (n8n Webhooks)
    Route::get('superadmin/n8n', [N8nSettingController::class, 'index']);
    Route::put('superadmin/n8n', [N8nSettingController::class, 'update']);
    Route::post('superadmin/n8n/test', [N8nSettingController::class, 'testWebhook']);

    // AI Settings
    Route::get('superadmin/ai-settings', [AiSettingController::class, 'index']);
    Route::put('superadmin/ai-settings', [AiSettingController::class, 'update']);
    Route::post('superadmin/ai-settings/test-connection', [AiSettingController::class, 'testConnection']);
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('auth/login', [AuthController::class, 'login']);

// Public endpoint — used by landing page to display pricing dynamically
Route::get('plans', function () {
    return response()->json([
        'data' => \App\Models\Plan::where('is_active', true)
            ->orderBy('price')
            ->get([
                'id',
                'name',
                'code',
                'price',
                'early_bird_price',
                'early_bird_limit',
                'student_limit',
                'teacher_limit',
                'features'
            ])
    ]);
});


Route::get('download-template', [ClassroomController::class, 'downloadTemplate'])->middleware('api');
Route::middleware("auth:sanctum")->group(function () {
    Route::post('auth/verifyToken', [AuthController::class, 'verifyToken']);
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', function (Request $request, \App\Services\TenantSettingService $tenantSettingService) {
        $user = $request->user()->load(['teacher.assignments.classroom']);
        $tenantUser = $user->tenantUsers()->where('is_active', true)->with('tenant.activeSubscription.plan')->first();
        $plan = $tenantUser?->tenant?->activeSubscription?->plan;

        $features = $plan?->features ?? [];

        $usage = null;
        if ($tenantUser?->tenant) {
            $tenant = $tenantUser->tenant;
            $usage = [
                'students' => \App\Models\Student::where('tenant_id', $tenant->id)->count(),
                'teachers' => \App\Models\Teacher::where('tenant_id', $tenant->id)->count(),
            ];

            // Fetch tenant settings to expose action thresholds to frontend workflows
            $tenantSettings = $tenantSettingService->getAll($tenant->id);
        }

        return response()->json([
            'user' => $user,
            'features' => $features,
            'plan' => $plan,
            'usage' => $usage,
            'tenant_settings' => $tenantSettings ?? null,
        ]);
    });

    Route::apiResource('study-programs', StudyProgramController::class);
    Route::prefix('study-programs/{studyProgram}')->group(function () {
        Route::get('classrooms', [ClassroomController::class, 'index']);
        Route::post('classrooms', [ClassroomController::class, 'store']);
    });

    Route::apiResource('classrooms', ClassroomController::class)->except(['index', 'store']);
    Route::get('classrooms', [ClassroomController::class, 'indexByTenant']); // SD/SMP: list all
    Route::post('classrooms', [ClassroomController::class, 'storeDirectly']); // SD/SMP: create without jurusan
    Route::prefix('classrooms/{classroom}')->group(function () {
        Route::get('students', [StudentController::class, 'index']);
        Route::post('students', [StudentController::class, 'store']);
        Route::post('import-students', [ClassroomController::class, 'importStudents']);
    });

    Route::get('students', [StudentController::class, 'indexByTenant']);
    Route::apiResource('students', StudentController::class)->except(['index', 'store']);

    Route::apiResource('teachers', TeacherController::class);
    Route::get('teachers/users/search', [TeacherController::class, 'searchUsers']);
    Route::apiResource('subjects', SubjectController::class);
    Route::prefix('teachers/{teacher}')->group(function () {
        Route::get('assignments', [TeacherController::class, 'indexAssignments']);
        Route::post('assignments', [TeacherController::class, 'storeAssignment']);
        Route::delete('assignments/{assignment}', [TeacherController::class, 'destroyAssignment']);
        Route::post('attach-user', [TeacherController::class, 'attachUser']);
        Route::post('link-user', [TeacherController::class, 'linkUser']);
    });

    Route::post('record-attendance', [AttendanceController::class, 'recordAttendance']);
    Route::get('attendance-history', [AttendanceController::class, 'getAttendanceHistory']);

    // Academic Year
    Route::get('academic-years', [AcademicYearController::class, 'index']);
    Route::get('academic-years/active', [AcademicYearController::class, 'active']);
    Route::post('academic-years', [AcademicYearController::class, 'store']);
    Route::put('academic-years/{id}/activate', [AcademicYearController::class, 'activate']);
    Route::put('academic-years/{id}/toggle-schedule-lock', [AcademicYearController::class, 'toggleScheduleLock']);
    Route::post('academic-years/{id}/close', [AcademicYearController::class, 'close']);
    Route::get('academic-years/{id}/grade-logs', [AcademicYearController::class, 'gradeLogs']);
    Route::post('students/{student}/demote', [AcademicYearController::class, 'demoteStudent']);

    // Tenant Settings
    Route::get('settings', [TenantSettingController::class, 'index']);
    Route::put('settings', [TenantSettingController::class, 'update']);
    Route::post('settings/logo', [TenantSettingController::class, 'uploadLogo']);

    // Schedules & Jurnal Mapel
    Route::get('schedules', [ScheduleImportController::class, 'index']);
    Route::delete('schedules', [ScheduleImportController::class, 'reset']);
    Route::post('schedule-imports/preview', [ScheduleImportController::class, 'preview']);
    Route::post('schedule-imports/confirm', [ScheduleImportController::class, 'confirm']);

    // Kurikulum & Konfigurasi Generator
    Route::get('school-periods', [SchoolPeriodController::class, 'index']);
    Route::post('school-periods', [SchoolPeriodController::class, 'bulkReplace']);

    Route::get('curriculum-items', [CurriculumItemController::class, 'index']);
    Route::post('curriculum-items/copy', [CurriculumItemController::class, 'copy']);
    Route::post('curriculum-items', [CurriculumItemController::class, 'store']);
    Route::put('curriculum-items/{id}', [CurriculumItemController::class, 'update']);
    Route::delete('curriculum-items/{id}', [CurriculumItemController::class, 'destroy']);

    Route::prefix('teachers/{teacherId}')->group(function () {
        Route::get('unavailabilities', [TeacherUnavailabilityController::class, 'index']);
        Route::post('unavailabilities', [TeacherUnavailabilityController::class, 'replace']);
    });

    // Schedule Generator
    Route::post('schedule/generate', [ScheduleGeneratorController::class, 'generate']);
    Route::post('schedule/generate/commit', [ScheduleGeneratorController::class, 'commit']);

    // Teacher Schedules & Journals
    Route::get('teacher/schedules', [LessonJournalController::class, 'teacherSchedules']);
    Route::get('lesson-journals/by-schedule/{scheduleId}', [LessonJournalController::class, 'bySchedule']);
    Route::post('lesson-journals', [LessonJournalController::class, 'store']);
    Route::put('lesson-journals/{id}', [LessonJournalController::class, 'update']);
    Route::get('lesson-journals/{journalId}/attendances', [LessonJournalController::class, 'attendances']);
    Route::post('lesson-journals/{journalId}/attendances', [LessonJournalController::class, 'storeAttendances']);

    // Admin Journal Monitoring
    Route::get('journal-monitoring', [JournalMonitoringController::class, 'index']);

    // Admin Absensi General
    Route::get('absensi', [AdminAttendanceController::class, 'index']);

    // Teacher Homeroom Attendance (Wali Kelas)
    Route::get('teacher/homeroom/general-attendance', [\App\Http\Controllers\TeacherHomeroomController::class, 'getGeneralAttendance']);
    Route::get('teacher/homeroom/journal-attendance', [\App\Http\Controllers\TeacherHomeroomController::class, 'getJournalAttendance']);

    // Discipline & Violations
    Route::apiResource('violations', \App\Http\Controllers\ViolationController::class);
    Route::post('student-violations/bulk', \App\Http\Controllers\StudentViolationController::class . '@bulkStore');
    Route::apiResource('student-violations', \App\Http\Controllers\StudentViolationController::class);

    // Positive Behaviors
    Route::apiResource('positive-behaviors', \App\Http\Controllers\PositiveBehaviorController::class);
    Route::post('student-positive-behaviors/bulk', \App\Http\Controllers\StudentPositiveBehaviorController::class . '@bulkStore');
    Route::apiResource('student-positive-behaviors', \App\Http\Controllers\StudentPositiveBehaviorController::class);

    // Bimbingan Konseling (BK)
    Route::prefix('bk')->group(function () {
        Route::get('dashboard-stats', [\App\Http\Controllers\BkDashboardController::class, 'getStats']);
        Route::get('needs-attention', [\App\Http\Controllers\BkDashboardController::class, 'getNeedsAttention']);
        Route::apiResource('counseling-sessions', \App\Http\Controllers\CounselingSessionController::class);
        Route::post('ai-recommendation', [AiCounselingController::class, 'generateRecommendation']);
    });

    // Kartu Siswa Admin (Ordering)
    Route::prefix('superadmin/id-card-orders')->group(function () {
        Route::get('/', [IdCardOrderController::class, 'indexAll']);
        Route::put('{id}', [IdCardOrderController::class, 'updateStatus']);
        Route::put('{id}/students/{studentPublicId}/nfc-uid', [IdCardOrderController::class, 'updateNfcUid']);
        Route::get('{id}/download', [IdCardOrderController::class, 'downloadData']);
    });

    // Kartu Siswa Admin (Ordering)
    Route::prefix('id-card-orders')->group(function () {
        Route::get('templates', [IdCardOrderController::class, 'templates']);
        Route::get('my-orders', [IdCardOrderController::class, 'myOrders']);
        Route::get('{id}', [IdCardOrderController::class, 'show']);
        Route::post('preview-zip', [IdCardOrderController::class, 'previewZip']);
        Route::post('/', [IdCardOrderController::class, 'store']);
        Route::post('{id}/pay-mock', [IdCardOrderController::class, 'payMock']);
    });

    // Guru Wali (Academic Advisor)
    Route::prefix('guru-wali')->group(function () {
        Route::get('dashboard', [\App\Http\Controllers\Api\GuruWaliController::class, 'getDashboard']);
        Route::get('students/{studentId}', [\App\Http\Controllers\Api\GuruWaliController::class, 'getStudentDetails']);
        Route::get('students/{studentId}/notes', [\App\Http\Controllers\Api\GuruWaliController::class, 'getNotes']);
        Route::post('students/{studentId}/notes', [\App\Http\Controllers\Api\GuruWaliController::class, 'storeNote']);
        Route::delete('notes/{noteId}', [\App\Http\Controllers\Api\GuruWaliController::class, 'destroyNote']);
    });

    // Superadmin assign Guru Wali (also inside teacher assignments flow)
    Route::get('teachers/{teacher:public_id}/guru-wali-assignments', [\App\Http\Controllers\Api\GuruWaliController::class, 'getAssignments']);
    Route::post('teachers/{teacher:public_id}/guru-wali-assignments', [\App\Http\Controllers\Api\GuruWaliController::class, 'updateAssignments']);
});

// Kiosk Attendance Routes
Route::prefix('kiosk')->group(function () {
    Route::get('token', [ApiAttendanceTokenController::class, 'getToken']);
    Route::get('validate-token', [ApiAttendanceTokenController::class, 'validateToken']);
    Route::get('students', [ApiAttendanceTokenController::class, 'getStudents']);
    Route::post('token/refresh', [ApiAttendanceTokenController::class, 'refresh']);
    Route::post('attendance/qr', [ApiAttendanceController::class, 'qr'])->middleware('auth:sanctum');
    Route::post('attendance/nfc', [ApiAttendanceController::class, 'nfc']);
    Route::post('attendance/camera-barcode', [ApiAttendanceController::class, 'cameraBarcode']);
    Route::post('attendance/batch', [ApiAttendanceController::class, 'batch']);
});

Route::get('attendance-token', [AttendanceTokenController::class, 'getToken']);
Route::get('late-arrivals', [AttendanceController::class, 'getLateArrivals']);
Route::get('student-attendances/{parent_phone}', [AttendanceController::class, 'getStudentAttendances']);
