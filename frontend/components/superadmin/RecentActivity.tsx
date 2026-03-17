import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { CheckCircle2, Clock, XCircle, Building2, UserPlus, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ActivityItem {
    id: string;
    type: 'new_school' | 'registration';
    title: string;
    description: string;
    date: string;
    status: 'success' | 'pending' | 'rejected' | 'approved';
}

interface RecentActivityProps {
    data: ActivityItem[];
}

export function RecentActivity({ data }: RecentActivityProps) {
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'success':
            case 'approved':
                return { 
                    icon: CheckCircle2, 
                    color: "text-emerald-500", 
                    bg: "bg-emerald-50",
                    badge: <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Selesai</Badge>
                };
            case 'pending':
                return { 
                    icon: Clock, 
                    color: "text-amber-500", 
                    bg: "bg-amber-50",
                    badge: <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>
                };
            case 'rejected':
                return { 
                    icon: XCircle, 
                    color: "text-red-500", 
                    bg: "bg-red-50",
                    badge: <Badge className="bg-red-100 text-red-800 border-red-200">Ditolak</Badge>
                };
            default:
                return { 
                    icon: Info, 
                    color: "text-blue-500", 
                    bg: "bg-blue-50",
                    badge: <Badge className="bg-blue-100 text-blue-800 border-blue-200">Info</Badge>
                };
        }
    };

    return (
        <Card className="h-full border shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Aktivitas Sistem</CardTitle>
                <CardDescription>Log pendaftaran dan onboarding terbaru</CardDescription>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="flex h-[300px] flex-col items-center justify-center text-sm text-muted-foreground gap-2">
                        <Info className="h-8 w-8 opacity-20" />
                        Belum ada aktivitas
                    </div>
                ) : (
                    <div className="relative space-y-6 before:absolute before:inset-y-0 before:left-[19px] before:w-px before:bg-muted">
                        {data.map((activity) => {
                            const config = getStatusConfig(activity.status);
                            const Icon = activity.type === 'new_school' ? Building2 : UserPlus;
                            
                            return (
                                <div key={activity.id} className="relative flex items-start gap-4">
                                    <div className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white shadow-sm`}>
                                        <Icon className={`h-5 w-5 ${activity.type === 'new_school' ? 'text-blue-500' : 'text-purple-500'}`} />
                                    </div>
                                    <div className="flex flex-1 flex-col gap-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-semibold leading-none">
                                                {activity.title}
                                            </p>
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                                {formatDistanceToNow(new Date(activity.date), {
                                                    addSuffix: true,
                                                    locale: id,
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {activity.description}
                                        </p>
                                        <div className="mt-1 flex items-center gap-2">
                                            {config.badge}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
