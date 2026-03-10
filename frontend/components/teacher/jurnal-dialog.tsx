"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, ClipboardList, Loader2, MapPin, Users } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────────────────────────────────

export interface Schedule {
    id: number
    day_of_week: number
    period_start: number
    period_end: number
    start_time: string
    end_time: string
    classroom: { id: number; name: string }
    subject: { id: number; name: string }
}

interface Journal {
    id: number
    room: string | null
    topic: string | null
    notes: string | null
    homework: string | null
}

type AttendanceStatus = "hadir" | "sakit" | "izin" | "alpha"

interface AttendanceRow {
    student_id: number
    public_id: string
    name: string
    nisn: string
    status: AttendanceStatus
    notes: string | null
    attendance_id: number | null
}

interface Props {
    open: boolean
    onOpenChange: (v: boolean) => void
    schedule: Schedule | null
    date: string // YYYY-MM-DD
}

// ── Status options ────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; active: string; idle: string }[] = [
    { value: "hadir", label: "Hadir", active: "bg-emerald-100 text-emerald-700 border-emerald-400", idle: "bg-background text-muted-foreground border-border" },
    { value: "sakit", label: "Sakit", active: "bg-yellow-100 text-yellow-700 border-yellow-400", idle: "bg-background text-muted-foreground border-border" },
    { value: "izin", label: "Izin", active: "bg-sky-100 text-sky-700 border-sky-400", idle: "bg-background text-muted-foreground border-border" },
    { value: "alpha", label: "Alpha", active: "bg-red-100 text-red-700 border-red-400", idle: "bg-background text-muted-foreground border-border" },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function JurnalDialog({ open, onOpenChange, schedule, date }: Props) {
    const [activeTab, setActiveTab] = useState("jurnal")

    // journal form
    const [journal, setJournal] = useState<Journal | null>(null)
    const [room, setRoom] = useState("")
    const [topic, setTopic] = useState("")
    const [notes, setNotes] = useState("")
    const [homework, setHomework] = useState("")
    const [isLoadingJournal, setIsLoadingJournal] = useState(false)
    const [isSavingJournal, setIsSavingJournal] = useState(false)

    // attendance
    const [attendances, setAttendances] = useState<AttendanceRow[]>([])
    const [isLoadingAbsen, setIsLoadingAbsen] = useState(false)
    const [isSavingAbsen, setIsSavingAbsen] = useState(false)

    // ── Fetch journal on open
    useEffect(() => {
        if (!open || !schedule) return
        setIsLoadingJournal(true)
        setJournal(null)
        setAttendances([])
        setActiveTab("jurnal")

        api.get(`/lesson-journals/by-schedule/${schedule.id}`, { params: { date } })
            .then(res => {
                const j: Journal | null = res.data.data
                setJournal(j)
                setRoom(j?.room ?? "")
                setTopic(j?.topic ?? "")
                setNotes(j?.notes ?? "")
                setHomework(j?.homework ?? "")
            })
            .catch(() => toast.error("Gagal memuat data jurnal"))
            .finally(() => setIsLoadingJournal(false))
    }, [open, schedule, date])

    // ── Fetch attendance when journal exists
    useEffect(() => {
        if (!journal?.id) return
        setIsLoadingAbsen(true)

        api.get(`/lesson-journals/${journal.id}/attendances`)
            .then(res => setAttendances(res.data.data ?? []))
            .catch(() => toast.error("Gagal memuat data absensi"))
            .finally(() => setIsLoadingAbsen(false))
    }, [journal?.id])

    // ── Save journal
    const handleSaveJournal = async () => {
        if (!schedule) return
        setIsSavingJournal(true)
        try {
            if (journal?.id) {
                const res = await api.put(`/lesson-journals/${journal.id}`, { room, topic, notes, homework })
                setJournal(res.data.data)
                toast.success("Jurnal berhasil diperbarui")
            } else {
                const res = await api.post("/lesson-journals", {
                    schedule_id: schedule.id,
                    date, room, topic, notes, homework,
                })
                setJournal(res.data.data)
                toast.success("Jurnal berhasil disimpan")
            }
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            toast.error(message ?? "Gagal menyimpan jurnal")
        } finally {
            setIsSavingJournal(false)
        }
    }

    // ── Toggle attendance status
    const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
        setAttendances(prev =>
            prev.map(a => a.student_id === studentId ? { ...a, status } : a)
        )
    }

    // ── Save attendance
    const handleSaveAbsen = async () => {
        if (!journal?.id) {
            toast.warning("Simpan jurnal terlebih dahulu sebelum mengisi absensi")
            return
        }
        setIsSavingAbsen(true)
        try {
            await api.post(`/lesson-journals/${journal.id}/attendances`, {
                attendances: attendances.map(a => ({
                    student_id: a.student_id,
                    status: a.status,
                    notes: a.notes,
                })),
            })
            toast.success("Absensi berhasil disimpan")
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            toast.error(message ?? "Gagal menyimpan absensi")
        } finally {
            setIsSavingAbsen(false)
        }
    }

    const handleClose = () => {
        onOpenChange(false)
        setTimeout(() => {
            setJournal(null)
            setRoom(""); setTopic(""); setNotes(""); setHomework("")
            setAttendances([])
        }, 200)
    }

    const dayName = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat"][schedule?.day_of_week ?? 0]

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
                {/* Header */}
                <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
                    <DialogTitle className="text-base font-semibold">
                        {schedule?.subject?.name ?? "Jurnal Pelajaran"}
                    </DialogTitle>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <Badge variant="outline" className="text-xs gap-1 font-normal">
                            <Users className="w-3 h-3" />
                            {schedule?.classroom?.name}
                        </Badge>
                        <Badge variant="outline" className="text-xs font-normal">
                            {dayName}, {schedule?.start_time} – {schedule?.end_time}
                        </Badge>
                        <Badge variant="outline" className="text-xs font-normal">
                            {date}
                        </Badge>
                    </div>
                </DialogHeader>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
                    <TabsList className="mx-5 mt-3 w-[calc(100%-2.5rem)] grid grid-cols-2 shrink-0">
                        <TabsTrigger value="jurnal" className="gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            Jurnal
                        </TabsTrigger>
                        <TabsTrigger value="absen" className="gap-1.5">
                            <ClipboardList className="w-3.5 h-3.5" />
                            Absen
                            {attendances.length > 0 && (
                                <span className="ml-1 text-xs text-muted-foreground">({attendances.length})</span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* Jurnal Tab */}
                    <TabsContent value="jurnal" className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                        {isLoadingJournal ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="space-y-1.5">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-9 w-full" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className="space-y-1.5">
                                    <Label className="flex items-center gap-1.5 text-sm">
                                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                        Lokasi / Ruangan
                                    </Label>
                                    <Input
                                        placeholder="Contoh: Ruang Kelas 10A, Lab Komputer..."
                                        value={room}
                                        onChange={e => setRoom(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-sm">Materi Pelajaran</Label>
                                    <Textarea
                                        placeholder="Topik atau materi yang diajarkan hari ini..."
                                        value={topic}
                                        onChange={e => setTopic(e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-sm">
                                        Catatan <span className="text-muted-foreground font-normal text-xs">(opsional)</span>
                                    </Label>
                                    <Textarea
                                        placeholder="Kendala, observasi, atau catatan tambahan..."
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        rows={2}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-sm">
                                        Tugas / PR <span className="text-muted-foreground font-normal text-xs">(opsional)</span>
                                    </Label>
                                    <Textarea
                                        placeholder="Tugas yang diberikan kepada siswa..."
                                        value={homework}
                                        onChange={e => setHomework(e.target.value)}
                                        rows={2}
                                    />
                                </div>
                            </>
                        )}
                    </TabsContent>

                    {/* Absen Tab */}
                    <TabsContent value="absen" className="flex-1 overflow-y-auto px-5 py-4">
                        {!journal?.id ? (
                            <div className="flex flex-col items-center justify-center h-40 text-center gap-2 text-muted-foreground">
                                <ClipboardList className="w-8 h-8 opacity-30" />
                                <p className="text-sm">Simpan jurnal terlebih dahulu untuk mengisi absensi.</p>
                            </div>
                        ) : isLoadingAbsen ? (
                            <div className="space-y-2">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <Skeleton key={i} className="h-11 w-full rounded-md" />
                                ))}
                            </div>
                        ) : attendances.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-center gap-2 text-muted-foreground">
                                <Users className="w-8 h-8 opacity-30" />
                                <p className="text-sm">Tidak ada siswa di kelas ini.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {/* Summary */}
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {STATUS_OPTIONS.map(s => (
                                        <span key={s.value} className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", s.active)}>
                                            {s.label}: {attendances.filter(a => a.status === s.value).length}
                                        </span>
                                    ))}
                                </div>

                                {attendances.map(row => (
                                    <div key={row.student_id} className="flex items-center gap-2 py-1 border-b last:border-0">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{row.name}</p>
                                            <p className="text-xs text-muted-foreground">{row.nisn}</p>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            {STATUS_OPTIONS.map(s => (
                                                <button
                                                    key={s.value}
                                                    onClick={() => handleStatusChange(row.student_id, s.value)}
                                                    className={cn(
                                                        "text-xs px-2 py-1 rounded border font-medium transition-colors",
                                                        row.status === s.value ? s.active : s.idle
                                                    )}
                                                >
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Footer */}
                <div className="border-t px-5 py-3 flex justify-end gap-2 bg-muted/30 shrink-0">
                    <Button variant="ghost" size="sm" onClick={handleClose}>
                        Tutup
                    </Button>
                    {activeTab === "jurnal" && (
                        <Button size="sm" onClick={handleSaveJournal} disabled={isSavingJournal} className="gap-1.5">
                            {isSavingJournal && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            {journal?.id ? "Update Jurnal" : "Simpan Jurnal"}
                        </Button>
                    )}
                    {activeTab === "absen" && (
                        <Button size="sm" onClick={handleSaveAbsen} disabled={isSavingAbsen || !journal?.id} className="gap-1.5">
                            {isSavingAbsen && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Simpan Absen
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
