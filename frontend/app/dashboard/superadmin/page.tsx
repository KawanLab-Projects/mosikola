"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, Plus, Building2, Package, Settings, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/superadmin/dashboard-stats');
                setData(response.data);
                setError(null);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
                setError("Gagal memuat data statistik. Silakan coba lagi nanti.");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
                <div className="relative flex h-16 w-16 items-center justify-center">
                    <Loader2 className="absolute h-full w-full animate-spin text-primary opacity-20" />
                    <Zap className="h-6 w-6 text-primary animate-pulse" />
                </div>
                <p className="text-sm font-medium text-muted-foreground animate-pulse">Menyiapkan Dashboard Utama...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center gap-4 text-center p-6">
                <div className="bg-destructive/10 p-4 rounded-full">
                    <Building2 className="h-8 w-8 text-destructive" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-bold">Terjadi Kesalahan</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        {error || "Data tidak tersedia. Pastikan server berjalan dengan benar."}
                    </p>
                </div>
                <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
                    Refresh Halaman
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 space-y-8 p-0">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50 p-6 rounded-2xl border border-blue-50/50 backdrop-blur-sm shadow-sm group">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Sistem Berjalan Normal</span>
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Dashboard Utama
                    </h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                        Pusat kendali ekosistem <span className="font-bold text-primary italic">Mosikola</span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button asChild className="rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                        <Link href="/dashboard/superadmin/registrasi">
                            <Plus className="mr-2 h-4 w-4" />
                            Registrasi Sekolah
                        </Link>
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <SystemKPIs data={data.kpis} />
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-6">
                    <GrowthChart data={data.growth_chart} />
                    
                    {/* Secondary Quick Access Grid */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="border-slate-100 hover:border-primary/20 transition-colors group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold">Manajemen Sekolah</CardTitle>
                                <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground mb-4">Kelola subdomain, database, dan status akses sekolah.</p>
                                <Button variant="outline" size="sm" asChild className="w-full rounded-lg">
                                    <Link href="/dashboard/superadmin/sekolah">Lihat Semua</Link>
                                </Button>
                            </CardContent>
                        </Card>
                        <Card className="border-slate-100 hover:border-primary/20 transition-colors group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold">Paket Langganan</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground mb-4">Konfigurasi limit, harga, dan fitur setiap paket.</p>
                                <Button variant="outline" size="sm" asChild className="w-full rounded-lg">
                                    <Link href="/dashboard/superadmin/paket">Kelola Paket</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Sidebar Activity */}
                <div className="lg:col-span-4 h-full">
                    <RecentActivity data={data.recent_activity} />
                </div>
            </div>
            
            {/* Footer / Info */}
            <div className="flex items-center justify-between px-2 pt-4 border-t border-slate-100 italic">
                <p className="text-[10px] text-muted-foreground">© 2026 Mosikola Enterprise Platform • v2.4.0-stable</p>
                <div className="flex items-center gap-4 text-[10px] text-primary font-bold">
                    <Link href="/dashboard/superadmin/settings" className="hover:underline flex items-center gap-1">
                        <Settings className="h-3 w-3" /> System Config
                    </Link>
                </div>
            </div>
        </div>
    );
}
