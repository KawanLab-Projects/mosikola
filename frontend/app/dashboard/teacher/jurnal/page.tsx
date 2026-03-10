"use client"

import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Calendar, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import JurnalDialog, { Schedule } from "@/components/teacher/jurnal-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mergeConsecutiveSchedules } from "@/lib/schedule-utils"

// ── Types ─────────────────────────────────────────────────────────────────────

interface AcademicYear {
    id: number
    name: string
    is_active: boolean
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS: { num: number; label: string }[] = [
    { num: 1, label: "Senin" },
    { num: 2, label: "Selasa" },
    { num: 3, label: "Rabu" },
    { num: 4, label: "Kamis" },
    { num: 5, label: "Jumat" },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayISO(): string {
    const d = new Date()
    return d.toISOString().split("T")[0]
}

// today's day_of_week (1=Mon … 5=Fri, 0/6 = weekend → default to 1)
function todayDow(): number {
    const d = new Date().getDay() // 0=Sun, 1=Mon ... 6=Sat
    return d >= 1 && d <= 5 ? d : 1
}



// ── Schedule Card ─────────────────────────────────────────────────────────────

function ScheduleCard({
    schedule,
    onClick,
}: {
    schedule: Schedule
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className="group w-full text-left rounded-lg border bg-card px-4 py-3 shadow-sm hover:border-primary/50 hover:shadow-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                        {schedule.subject?.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {schedule.classroom?.name}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="secondary" className="text-xs px-1.5 gap-1">
                        <Clock className="w-3 h-3" />
                        {schedule.start_time} – {schedule.end_time}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                        Jam {schedule.period_start}
                        {schedule.period_end !== schedule.period_start && `–${schedule.period_end}`}
                    </span>
                </div>
            </div>
        </button>
    )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TeacherJurnalPage() {
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
    const [selectedYearId, setSelectedYearId] = useState<string>("")
    const [schedules, setSchedules] = useState<Schedule[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [date, setDate] = useState(todayISO())
    const [activeDow, setActiveDow] = useState(todayDow())

    // dialog
    const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    useEffect(() => {
        api.get("/academic-years")
            .then(res => {
                const years: AcademicYear[] = res.data.data ?? []
                setAcademicYears(years)
                const active = years.find(y => y.is_active)
                if (active) setSelectedYearId(String(active.id))
            })
            .catch(() => toast.error("Gagal memuat tahun ajaran"))
    }, [])

    const fetchSchedules = useCallback(async () => {
        if (!selectedYearId) return
        setIsLoading(true)
        try {
            const res = await api.get("/teacher/schedules", {
                params: { academic_year_id: selectedYearId },
            })
            setSchedules(mergeConsecutiveSchedules((res.data.data ?? []) as Schedule[]))
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Gagal memuat jadwal"
            toast.error(msg)
        } finally {
            setIsLoading(false)
        }
    }, [selectedYearId])

    useEffect(() => { fetchSchedules() }, [fetchSchedules])

    // keep active day in sync with selected date
    useEffect(() => {
        const parsed = new Date(date + "T00:00:00")
        const dow = parsed.getDay()
        if (dow >= 1 && dow <= 5) setActiveDow(dow)
    }, [date])

    const schedulesForDay = (dow: number) =>
        schedules
            .filter(s => s.day_of_week === dow)
            .sort((a, b) => a.period_start - b.period_start)

    const handleCardClick = (schedule: Schedule) => {
        setSelectedSchedule(schedule)
        setDialogOpen(true)
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Jurnal Mengajar</h1>
                <p className="text-muted-foreground text-sm">
                    Pilih jadwal mengajar untuk mengisi jurnal dan absensi siswa.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1.5">
                    <Label className="text-sm">Tahun Ajaran</Label>
                    <Select value={selectedYearId} onValueChange={setSelectedYearId}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Pilih tahun ajaran" />
                        </SelectTrigger>
                        <SelectContent>
                            {academicYears.map(y => (
                                <SelectItem key={y.id} value={String(y.id)}>
                                    {y.name} {y.is_active && <span className="text-emerald-500">(Aktif)</span>}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-sm flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        Tanggal Jurnal
                    </Label>
                    <Input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-44"
                    />
                </div>
            </div>

            {/* Loading state */}
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                </div>
            ) : schedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2 border rounded-xl">
                    <BookOpen className="w-10 h-10 opacity-25" />
                    <p className="text-sm">Tidak ada jadwal mengajar untuk tahun ajaran ini.</p>
                    <p className="text-xs opacity-70">Pastikan Anda sudah dimasukkan ke jadwal oleh admin.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Day tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {DAYS.map(d => {
                            const count = schedulesForDay(d.num).length
                            return (
                                <span
                                    key={d.num}
                                    className={cn(
                                        "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border select-none",
                                        activeDow === d.num
                                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                            : "bg-background border-border text-muted-foreground"
                                    )}
                                >
                                    {d.label}
                                    {count > 0 && (
                                        <span className={cn(
                                            "ml-1.5 text-xs rounded-full px-1.5 py-0.5",
                                            activeDow === d.num
                                                ? "bg-primary-foreground/20 text-primary-foreground"
                                                : "bg-muted text-muted-foreground"
                                        )}>
                                            {count}
                                        </span>
                                    )}
                                </span>
                            )
                        })}
                    </div>

                    {/* Schedule cards for active day */}
                    <div>
                        {schedulesForDay(activeDow).length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
                                    <Clock className="w-7 h-7 opacity-25" />
                                    <p className="text-sm">
                                        Tidak ada jadwal untuk hari {DAYS.find(d => d.num === activeDow)?.label}.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {schedulesForDay(activeDow).map(schedule => (
                                    <ScheduleCard
                                        key={schedule.id}
                                        schedule={schedule}
                                        onClick={() => handleCardClick(schedule)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Dialog */}
            <JurnalDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                schedule={selectedSchedule}
                date={date}
            />
        </div>
    )
}