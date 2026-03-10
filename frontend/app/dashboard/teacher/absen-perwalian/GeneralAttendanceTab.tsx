import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Download, Loader2, ArrowLeftRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Student {
    id: string;
    name: string;
}

interface GeneralAttendance {
    id: string;
    student: Student;
    attended_at: string;
    type: "check_in" | "check_out";
    method?: string;
    status: string;
}

export default function GeneralAttendanceTab() {
    const [date, setDate] = useState<Date>(new Date())

    const { data, isLoading } = useQuery({
        queryKey: ["teacher-homeroom-general", format(date, "yyyy-MM-dd")],
        queryFn: async () => {
            const res = await api.get(`/teacher/homeroom/general-attendance`, {
                params: { date: format(date, "yyyy-MM-dd") }
            })
            return res.data.data
        }
    })

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "hadir":
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Hadir</Badge>
            case "terlambat":
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200">Terlambat</Badge>
            case "sakit":
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">Sakit</Badge>
            case "izin":
                return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200">Izin</Badge>
            case "alpha":
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">Alpha</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {format(date, "dd MMMM yyyy")}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(day) => day && setDate(day)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>
            </div>

            <div className="rounded-md border bg-white dark:bg-slate-950">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">No</TableHead>
                            <TableHead>Nama Siswa</TableHead>
                            <TableHead>Waktu</TableHead>
                            <TableHead>Tipe</TableHead>
                            <TableHead>Metode</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <Loader2 className="h-8 w-8 animate-spin mb-4" />
                                        <p>Memuat data absensi...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                    Tidak ada data absensi pada tanggal ini.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.map((item: GeneralAttendance, idx: number) => (
                                <TableRow key={item.id}>
                                    <TableCell>{idx + 1}</TableCell>
                                    <TableCell className="font-medium">{item.student?.name}</TableCell>
                                    <TableCell>{format(new Date(item.attended_at), "HH:mm")}</TableCell>
                                    <TableCell>
                                        {item.type === "check_in" ? (
                                            <div className="flex items-center text-slate-600">
                                                <ArrowLeftRight className="mr-2 h-3 w-3 rotate-180" /> Masuk
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-slate-600">
                                                <ArrowLeftRight className="mr-2 h-3 w-3" /> Pulang
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="capitalize">{item.method || "-"}</TableCell>
                                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
