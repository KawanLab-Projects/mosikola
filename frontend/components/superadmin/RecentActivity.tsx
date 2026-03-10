import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { CheckCircle2, Clock, XCircle, Building2, Info } from "lucide-react";

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
    const getIcon = (type: string, status: string) => {
        if (type === 'new_school') return <Building2 className="h-4 w-4 text-blue-500" />;
        if (status === 'success' || status === 'approved') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
        if (status === 'pending') return <Clock className="h-4 w-4 text-yellow-500" />;
        if (status === 'rejected') return <XCircle className="h-4 w-4 text-red-500" />;
        return <Info className="h-4 w-4 text-gray-500" />;
    };

    return (
        <Card className="h-full w-full">
            <CardHeader>
                <CardTitle>Aktivitas Terbaru</CardTitle>
                <CardDescription>Pendaftaran dan registrasi sekolah</CardDescription>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                        Belum ada aktivitas
                    </div>
                ) : (
                    <div className="space-y-6">
                        {data.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-4">
                                <div className="mt-1 rounded-full p-1.5 bg-muted">
                                    {getIcon(activity.type, activity.status)}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {activity.title}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {activity.description}
                                    </p>
                                </div>
                                <div className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatDistanceToNow(new Date(activity.date), {
                                        addSuffix: true,
                                        locale: id,
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
