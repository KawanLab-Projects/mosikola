import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Activity, CreditCard } from "lucide-react";

export interface KPIStats {
    total_tenants: number;
    active_tenants: number;
    total_users: number;
    active_subscriptions: number;
}

interface SystemKPIsProps {
    data: KPIStats;
}

export function SystemKPIs({ data }: SystemKPIsProps) {
    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sekolah Terdaftar</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.total_tenants}</div>
                    <p className="text-xs text-muted-foreground">
                        Semua status
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sekolah Aktif</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.active_tenants}</div>
                    <p className="text-xs text-muted-foreground">
                        Beroperasi saat ini
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pengguna Aktif</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.total_users}</div>
                    <p className="text-xs text-muted-foreground">
                        Siswa, Guru & Admin
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Langganan Aktif</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.active_subscriptions}</div>
                    <p className="text-xs text-muted-foreground">
                        Berbayar & Free Trial
                    </p>
                </CardContent>
            </Card>
        </>
    );
}
