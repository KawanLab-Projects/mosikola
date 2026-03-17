<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\TenantRegistration;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SuperadminDashboardController extends Controller
{
    public function getStats(Request $request)
    {
        // 1. System KPIs
        $totalTenants = Tenant::count();
        $activeTenants = Tenant::where('is_active', true)->count();
        $totalUsers = User::count();

        // Active subscriptions (not expired)
        $activeSubscriptions = Subscription::where('is_active', true)
            ->where('end_date', '>=', now())
            ->count();

        $pendingRegistrations = TenantRegistration::where('status', 'pending')->count();

        // 2. Growth Chart Data (Schools onboarded per month for the last 6 months)
        $sixMonthsAgo = Carbon::now()->subMonths(5)->startOfMonth();

        // This query works for both MySQL and modern tools depending on DB.
        // In Laravel, we can just fetch and group in memory if the dataset is small,
        // to be safe across different database drivers (SQLite vs MySQL)

        $tenantsRecent = Tenant::where('created_at', '>=', $sixMonthsAgo)
            ->get()
            ->groupBy(function ($val) {
                return Carbon::parse($val->created_at)->format('Y-m');
            });

        // Ensure we have an entry for each of the last 6 months even if 0
        $growthData = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthString = Carbon::now()->subMonths($i)->format('Y-m');
            $monthLabel = Carbon::now()->subMonths($i)->format('M Y');

            $growthData[] = [
                'name' => $monthLabel,
                'schools' => isset($tenantsRecent[$monthString]) ? $tenantsRecent[$monthString]->count() : 0,
            ];
        }

        // 3. Recent Activity Feed
        // We will combine recent tenant creations and recent registrations.
        $recentActivities = collect();

        // Recent Tenants Onboarded
        $recentTenants = Tenant::orderBy('created_at', 'desc')->take(5)->get()->map(function ($tenant) {
            return [
                'id' => 'tenant_'.$tenant->id,
                'type' => 'new_school',
                'title' => 'New School Registered',
                'description' => $tenant->name.' has joined Mosikola.',
                'date' => $tenant->created_at->toISOString(),
                'status' => 'success',
            ];
        });
        $recentActivities = $recentActivities->concat($recentTenants);

        // Recent Registrations (Pending)
        $recentRegistrations = TenantRegistration::orderBy('created_at', 'desc')->take(5)->get()->map(function ($reg) {
            return [
                'id' => 'reg_'.$reg->id,
                'type' => 'registration',
                'title' => 'New Registration Request',
                'description' => $reg->school_name.' is requesting to join.',
                'date' => $reg->created_at->toISOString(),
                'status' => $reg->status, // pending, approved, rejected
            ];
        });
        $recentActivities = $recentActivities->concat($recentRegistrations);

        // Sort combined activities by date descending and take top 10
        $recentActivities = $recentActivities->sortByDesc('date')->take(10)->values();

        return response()->json([
            'kpis' => [
                'total_tenants' => $totalTenants,
                'active_tenants' => $activeTenants,
                'total_users' => $totalUsers,
                'active_subscriptions' => $activeSubscriptions,
                'pending_registrations' => $pendingRegistrations,
            ],
            'growth_chart' => $growthData,
            'recent_activity' => $recentActivities,
        ]);
    }
}
