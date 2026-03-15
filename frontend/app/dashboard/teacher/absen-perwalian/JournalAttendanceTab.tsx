import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Download, Loader2, BookOpen } from "lucide-react"
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

interface Subject {
    id: string;
    name: string;
}

interface Teacher {
    id: string;
    name: string;
}

interface AttendanceSummary {
    hadir: number;
    sakit: number;
    izin: number;
    alpha: number;
}

interface JournalAttendance {
    id: string;
    subject: Subject;
    teacher: Teacher;
    topic?: string;
    status: "completed" | "draft";
    attendance_summary: AttendanceSummary;
}

export default function JournalAttendanceTab() {
    const [date, setDate] = useState<Date>(new Date())

    const { data, isLoading } = useQuery<JournalAttendance[]>({
        queryKey: ["teacher-homeroom-journal", format(date, "yyyy-MM-dd")],
        queryFn: async () => {
            const res = await api.get(`/teacher/homeroom/journal-attendance`, {
                params: { date: format(date, "yyyy-MM-dd") }
            })
            return res.data.data
        }
    })

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
                            <TableHead>Mata Pelajaran</TableHead>
                            <TableHead>Guru</TableHead>
                            <TableHead className="text-center">Hadir</TableHead>
                            <TableHead className="text-center">Sakit</TableHead>
                            <TableHead className="text-center">Izin</TableHead>
                            <TableHead className="text-center">Alpha</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow key="loading">
                                <TableCell colSpan={7} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <Loader2 className="h-8 w-8 animate-spin mb-4" />
                                        <p>Memuat data jurnal...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data?.length === 0 ? (
                            <TableRow key="empty">
                                <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                                    Tidak ada data jurnal masuk pada tanggal ini.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.map((item: JournalAttendance, idx: number) => (
                                <TableRow key={item.id}>
                                    <TableCell>{idx + 1}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 text-slate-700 dark:text-slate-300">
                                            <div className="font-semibold flex items-center gap-2">
                                                <BookOpen className="w-4 h-4 text-blue-500" />
                                                {item.subject?.name}
                                                {item.status === 'completed' ? (
                                                    <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100 text-[10px] ml-2">Selesai</Badge>
                                                ) : item.status === 'draft' ? (
                                                    <Badge variant="outline" className="text-[10px] ml-2">Draft</Badge>
                                                ) : null}
                                            </div>
                                            <div className="text-sm text-slate-500 line-clamp-1 max-w-[200px]">
                                                {item.topic || "Belum ada materi"}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-600 dark:text-slate-300">{item.teacher?.name}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 font-bold w-8 justify-center">
                                            {item.attendance_summary?.hadir}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 font-bold w-8 justify-center">
                                            {item.attendance_summary?.sakit}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200 font-bold w-8 justify-center">
                                            {item.attendance_summary?.izin}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 font-bold w-8 justify-center">
                                            {item.attendance_summary?.alpha}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
