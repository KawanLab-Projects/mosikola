"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";


import { SystemKPIs, type KPIStats } from "@/components/superadmin/SystemKPIs";
import { GrowthChart, type GrowthData } from "@/components/superadmin/GrowthChart";
import { RecentActivity, type ActivityItem } from "@/components/superadmin/RecentActivity";

interface DashboardData {
    kpis: KPIStats;
    growth_chart: GrowthData[];
    recent_activity: ActivityItem[];
}

export default function SuperadminDashboardPage() {
    // We will bypass useAuth for now if it doesn't exist,
    // assuming superadmin routes are protected via middleware or layout.
    // To ensure safety, we can rely on an API call or allow mounting.
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/superadmin/dashboard-stats');
                setData(response.data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading || !data) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Dashboard Superadmin</h2>
                    <p className="text-muted-foreground">Sistem Utama Mosikola</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild>
                        <Link href="/dashboard/superadmin/registrasi">
                            <Plus className="mr-2 h-4 w-4" />
                            Registrasi Sekolah Baru
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <SystemKPIs data={data.kpis} />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    <GrowthChart data={data.growth_chart} />
                </div>

                <div className="col-span-3">
                    <RecentActivity data={data.recent_activity} />
                </div>
            </div>
        </div>
    );
}
