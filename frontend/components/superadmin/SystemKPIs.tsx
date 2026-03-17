import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, UserPlus } from "lucide-react";

export interface KPIStats {
    total_tenants: number;
    active_tenants: number;
    total_users: number;
    active_subscriptions: number;
    pending_registrations: number;
}

interface SystemKPIsProps {
    data: KPIStats;
}

export function SystemKPIs({ data }: SystemKPIsProps) {
    const kpis = [
        {
            title: "Total Sekolah",
            value: data.total_tenants,
            description: "Semua status operasional",
            icon: Building2,
            gradient: "from-blue-500/10 to-indigo-500/10",
            iconColor: "text-blue-600",
            borderColor: "border-blue-100",
        },
        {
            title: "Sekolah Aktif",
            value: data.active_tenants,
            description: "Operasional saat ini",
            icon: Building2,
            gradient: "from-emerald-500/10 to-teal-500/10",
            iconColor: "text-emerald-600",
            borderColor: "border-emerald-100",
        },
        {
            title: "Total Pengguna",
            value: data.total_users,
            description: "Siswa, Guru & Admin",
            icon: Users,
            gradient: "from-violet-500/10 to-purple-500/10",
            iconColor: "text-violet-600",
            borderColor: "border-violet-100",
        },
        {
            title: "Permohonan Baru",
            value: data.pending_registrations,
            description: "Menunggu persetujuan",
            icon: UserPlus,
            gradient: "from-amber-500/10 to-orange-500/10",
            iconColor: "text-amber-600",
            borderColor: "border-amber-100",
        },
    ];

    return (
        <>
            {kpis.map((kpi, i) => (
                <Card key={i} className={`relative overflow-hidden border shadow-sm transition-all hover:shadow-md ${kpi.borderColor}`}>
                    <div className={`absolute inset-0 bg-linear-to-br opacity-50 ${kpi.gradient}`} />
                    <CardContent className="relative p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                                <div className="text-3xl font-bold tracking-tight">{kpi.value}</div>
                            </div>
                            <div className={`rounded-xl p-2.5 bg-white shadow-sm border ${kpi.borderColor}`}>
                                <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs text-muted-foreground">
                            {kpi.description}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </>
    );
}
