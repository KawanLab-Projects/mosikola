"use client"

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, Zap, Users, Shield, Clock, Plus, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface User {
    id?: number | string;
    name: string;
    email: string;
    role?: string;
}

interface DashboardData {
    user: User;
    features: string[];
    plan: {
        name: string;
        student_limit: number;
        teacher_limit: number;
    } | null;
    usage: {
        students: number;
        teachers: number;
    } | null;
}

export default function AdminDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/auth/me');
                setData(response.data);
            } catch (error) {
                console.error("Failed to fetch admin dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-1 h-[60vh] flex-col items-center justify-center gap-4">
                <div className="relative flex h-16 w-16 items-center justify-center">
                    <Loader2 className="absolute h-full w-full animate-spin text-primary opacity-20" />
                    <Zap className="h-6 w-6 text-primary animate-pulse" />
                </div>
                <p className="text-sm font-medium text-muted-foreground animate-pulse">Menyiapkan Dashboard Admin...</p>
            </div>
        );
    }

    const usage = data?.usage;
    const plan = data?.plan;

    return (
        <div className="flex flex-col flex-1 space-y-8 p-0">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50 p-6 rounded-2xl border border-blue-50/50 backdrop-blur-sm shadow-sm group">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                         <div className="flex h-6 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-600">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                            </span>
                            Sistem Aktif
                        </div>
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Dashboard Sekolah
                    </h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                        Selamat datang kembali, admin!
                    </p>
                </div>
                 <div className="flex items-center gap-3">
                    <Button asChild className="rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                        <Link href="/dashboard/siswa">
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Siswa
                        </Link>
                    </Button>
                </div>
            </div>

            {/* KPI Metrics List */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Siswa Card */}
                <Card className="relative overflow-hidden border border-blue-100 shadow-sm transition-all hover:shadow-md group">
                    <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 to-indigo-500/10 opacity-50 group-hover:opacity-70 transition-opacity" />
                    <CardContent className="relative p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Total Siswa Aktif</p>
                                <div className="flex items-baseline gap-2">
                                  <div className="text-3xl font-bold tracking-tight">{usage?.students || 0}</div>
                                  {plan?.student_limit && <span className="text-xs text-muted-foreground font-medium">/ {plan.student_limit}</span>}
                                </div>
                            </div>
                            <div className="rounded-xl p-2.5 bg-white shadow-sm border border-blue-100">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                         {plan?.student_limit && (
                           <div className="mt-4 w-full bg-blue-100 rounded-full h-1.5 opacity-60">
                             <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(((usage?.students || 0) / plan.student_limit) * 100, 100)}%` }}></div>
                           </div>
                         )}
                    </CardContent>
                </Card>

                {/* Guru Card */}
                <Card className="relative overflow-hidden border border-emerald-100 shadow-sm transition-all hover:shadow-md group">
                    <div className="absolute inset-0 bg-linear-to-br from-emerald-500/10 to-teal-500/10 opacity-50 group-hover:opacity-70 transition-opacity" />
                    <CardContent className="relative p-6">
                         <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Total Guru Aktif</p>
                                <div className="flex items-baseline gap-2">
                                  <div className="text-3xl font-bold tracking-tight">{usage?.teachers || 0}</div>
                                  {plan?.teacher_limit && <span className="text-xs text-muted-foreground font-medium">/ {plan.teacher_limit}</span>}
                                </div>
                            </div>
                            <div className="rounded-xl p-2.5 bg-white shadow-sm border border-emerald-100">
                                <Shield className="h-5 w-5 text-emerald-600" />
                            </div>
                        </div>
                        {plan?.teacher_limit && (
                          <div className="mt-4 w-full bg-emerald-100 rounded-full h-1.5 opacity-60">
                             <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(((usage?.teachers || 0) / plan.teacher_limit) * 100, 100)}%` }}></div>
                          </div>
                        )}
                    </CardContent>
                </Card>

                {/* Subscription Card */}
                 <Card className="relative overflow-hidden border border-violet-100 shadow-sm transition-all hover:shadow-md group">
                    <div className="absolute inset-0 bg-linear-to-br from-violet-500/10 to-purple-500/10 opacity-50 group-hover:opacity-70 transition-opacity" />
                    <CardContent className="relative p-6 h-full flex flex-col justify-center">
                         <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Paket Layanan</p>
                                <div className="text-xl font-bold tracking-tight text-violet-900">{plan?.name || "Mosikola Trial"}</div>
                            </div>
                            <div className="rounded-xl p-2.5 bg-white shadow-sm border border-violet-100">
                                <Zap className="h-5 w-5 text-violet-600" />
                            </div>
                        </div>
                         <div className="mt-4 flex items-center text-xs font-semibold text-violet-600/80">
                             Dukungan penuh tim Mosikola Enterprise
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions & Panels Content */}
            <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-6">
                     {/* Secondary Modules Grid */}
                     <div className="grid gap-6 md:grid-cols-2">
                        <Card className="border-slate-100 hover:border-primary/20 transition-colors group">
                             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold">Tahun Akademik & Kurikulum</CardTitle>
                                <BookOpen className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground mb-4">Pengaturan jadwal, mata pelajaran dan periode ajaran.</p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" asChild className="w-full rounded-lg">
                                        <Link href="/dashboard/tahun-ajaran">Kelola Tahun</Link>
                                    </Button>
                                     <Button variant="outline" size="sm" asChild className="w-full rounded-lg">
                                        <Link href="/dashboard/jadwal-pelajaran">Jadwal</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-100 hover:border-primary/20 transition-colors group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold">Kehadiran & Kedisiplinan</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground mb-4">Laporan ketidakhadiran, scan absensi umum, dan telat.</p>
                                 <div className="flex gap-2">
                                    <Button variant="outline" size="sm" asChild className="w-full rounded-lg">
                                        <Link href="/dashboard/absen-umum">Absensi</Link>
                                    </Button>
                                     <Button variant="outline" size="sm" asChild className="w-full rounded-lg">
                                        <Link href="/dashboard/disiplin">Riwayat</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                     </div>
                </div>

                <div className="lg:col-span-4 h-full">
                   <Card className="h-full border-slate-100 bg-slate-50/50">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold">Pengumuman & Fitur Baru</CardTitle>
                            <CardDescription>Pembaruan ekosistem platform</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="space-y-4">
                                <div className="bg-white p-3 rounded-lg border border-indigo-100/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] transition-transform hover:-translate-y-0.5 relative">
                                    <div className="absolute top-0 right-3 -translate-y-[50%] bg-indigo-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">New</div>
                                    <h4 className="text-xs font-semibold text-slate-800 mb-1">Integrasi Jurnal Harian</h4>
                                    <p className="text-[11px] text-slate-500 leading-relaxed">Guru kini dapat mengisi jurnal harian terintegrasi dengan jadwal dan absensi langsung di kelas.</p>
                                </div>
                                 <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                                    <h4 className="text-xs font-semibold text-slate-800 mb-1">Mosikola Enterprise Platform</h4>
                                    <p className="text-[11px] text-slate-500 leading-relaxed">Silahkan atur kelas, guru, dan jadwal pengajaran di menu dashboard yang tersedia untuk operasional sekolah.</p>
                                </div>
                             </div>
                        </CardContent>
                   </Card>
                </div>
            </div>
        </div>
    )
}