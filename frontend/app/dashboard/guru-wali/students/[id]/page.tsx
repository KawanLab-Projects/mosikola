"use client"

import { useEffect, useState, useCallback, use } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, Clock, AlertTriangle, MessageSquarePlus, Trash2, CalendarDays } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface Note {
    id: number
    note: string
    date: string
    teacher?: { name: string }
}

interface StudentDetail {
    id: number
    name: string
    nisn: string
    classroom?: { name: string }
    total_points: number
    student_violations?: {
        id: number
        date: string
        points: number
        violation?: { name: string }
    }[]
    student_positive_behaviors?: {
        id: number
        date: string
        points: number
        positive_behavior?: { name: string }
    }[]
    attendances?: {
        id: number
        date: string
        status: string
    }[]
}

interface AcademicYear {
    id: number
    name: string
    is_active: boolean
}

export default function GuruWaliStudentDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id: studentId } = use(params)
    const [student, setStudent] = useState<StudentDetail | null>(null)
    const [notes, setNotes] = useState<Note[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])

    const [newNote, setNewNote] = useState({
        note: "",
        date: format(new Date(), 'yyyy-MM-dd')
    })

    const fetchConfig = useCallback(async () => {
        try {
            const res = await api.get('/academic-years')
            setAcademicYears(res.data.data || [])
        } catch { /* silent */ }
    }, [])

    const fetchData = useCallback(async () => {
        if (!studentId) return
        setIsLoading(true)
        try {
            const [studentRes, notesRes] = await Promise.all([
                api.get(`/guru-wali/students/${studentId}`),
                api.get(`/guru-wali/students/${studentId}/notes`)
            ])
            setStudent(studentRes.data.data)
            setNotes(notesRes.data.data || [])
        } catch {
            toast.error("Gagal memuat data siswa")
        } finally {
            setIsLoading(false)
        }
    }, [studentId])

    useEffect(() => {
        fetchConfig()
        fetchData()
    }, [fetchConfig, fetchData])

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newNote.note.trim()) {
            toast.error("Catatan tidak boleh kosong")
            return
        }

        const activeYear = academicYears.find(y => y.is_active)
        if (!activeYear) {
            toast.error("Tidak ada tahun ajaran aktif")
            return
        }

        setIsSubmitting(true)
        try {
            await api.post(`/guru-wali/students/${studentId}/notes`, {
                ...newNote,
                academic_year_id: activeYear.id
            })
            toast.success("Catatan perkembangan berhasil ditambahkan")
            setNewNote({ note: "", date: format(new Date(), 'yyyy-MM-dd') })
            // Refresh notes
            const notesRes = await api.get(`/guru-wali/students/${studentId}/notes`)
            setNotes(notesRes.data.data || [])
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } }
            toast.error(e?.response?.data?.message || "Gagal menyimpan catatan")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteNote = async (noteId: number) => {
        if (!confirm("Hapus catatan ini?")) return
        try {
            await api.delete(`/guru-wali/notes/${noteId}`)
            toast.success("Catatan dihapus")
            setNotes(prev => prev.filter(n => n.id !== noteId))
        } catch {
            toast.error("Gagal menghapus catatan")
        }
    }

    if (isLoading) {
        return <div className="p-6">Memuat data siswa...</div>
    }

    if (!student) {
        return (
            <div className="p-6 text-center space-y-4">
                <p>Data siswa tidak ditemukan atau tidak dalam binaan Anda.</p>
                <Button asChild variant="outline">
                    <Link href="/dashboard/guru-wali/dashboard">Kembali ke Dashboard</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6 max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                    <Link href="/dashboard/guru-wali/dashboard">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{student.name}</h1>
                    <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2">
                        {student.nisn} • {student.classroom?.name || "-"}
                        <Badge variant={student.total_points >= 80 ? 'default' : student.total_points <= 50 ? 'destructive' : 'secondary'} className="ml-2">
                            {student.total_points} Poin
                        </Badge>
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_400px]">
                {/* Left Column: History (Read-only) */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                Riwayat Pelanggaran & Poin (Read Only)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {(!student.student_violations || student.student_violations.length === 0) && (!student.student_positive_behaviors || student.student_positive_behaviors.length === 0) ? (
                                <p className="text-sm text-muted-foreground italic text-center py-4">Belum ada riwayat poin kedisiplinan</p>
                            ) : (
                                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                    {/* Violations */}
                                    {student.student_violations?.map((v) => (
                                        <div key={`v-${v.id}`} className="flex justify-between items-start text-sm border-b pb-2 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium text-destructive">{v.violation?.name}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(v.date), 'dd MMMM yyyy', { locale: id })}</p>
                                            </div>
                                            <Badge variant="destructive" className="shrink-0">-{v.points} Pts</Badge>
                                        </div>
                                    ))}
                                    {/* Positive */}
                                    {student.student_positive_behaviors?.map((p) => (
                                        <div key={`p-${p.id}`} className="flex justify-between items-start text-sm border-b pb-2 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium text-green-600">{p.positive_behavior?.name}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(p.date), 'dd MMMM yyyy', { locale: id })}</p>
                                            </div>
                                            <Badge variant="outline" className="shrink-0 text-green-600 bg-green-50">+{p.points} Pts</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5 text-blue-500" />
                                Riwayat Kehadiran (Read Only)
                            </CardTitle>
                            <CardDescription>Menampilkan 20 kehadiran terakhir</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {!student.attendances || student.attendances.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic text-center py-4">Belum ada data kehadiran</p>
                            ) : (
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                    {student.attendances.map((a) => (
                                        <div key={a.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                                <span>{format(new Date(a.date), 'dd MMM yyyy', { locale: id })}</span>
                                            </div>
                                            <Badge variant={a.status === 'present' ? 'default' : a.status === 'absent' ? 'destructive' : 'secondary'}>
                                                {a.status === 'present' ? 'Hadir' : a.status === 'absent' ? 'Alpa' : a.status === 'sick' ? 'Sakit' : a.status === 'permission' ? 'Izin' : 'Terlambat'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Development Notes */}
                <div className="space-y-6">
                    <Card className="border-primary/20 sticky top-6 shadow-sm">
                        <CardHeader className="bg-primary/5 pb-4 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-primary" />
                                Catatan Perkembangan Siswa
                            </CardTitle>
                            <CardDescription>
                                Tambahkan observasi kualitatif, hasil diskusi, atau perkembangan sikap murid.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <form onSubmit={handleAddNote} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="date">Tanggal Catatan</Label>
                                    <Input
                                        type="date"
                                        id="date"
                                        required
                                        value={newNote.date}
                                        onChange={e => setNewNote({ ...newNote, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="note">Isi Catatan</Label>
                                    <Textarea
                                        id="note"
                                        placeholder="Tuliskan perkembangan, teguran persuasif, atau hasil pembinaan..."
                                        rows={4}
                                        required
                                        value={newNote.note}
                                        onChange={e => setNewNote({ ...newNote, note: e.target.value })}
                                        className="resize-none"
                                    />
                                </div>
                                <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
                                    <MessageSquarePlus className="h-4 w-4" />
                                    {isSubmitting ? "Menyimpan..." : "Simpan Catatan"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <h3 className="font-semibold px-1">Log Catatan Sebelumnya</h3>
                        {notes.length === 0 ? (
                            <div className="text-center py-8 border border-dashed rounded-lg bg-muted/20">
                                <p className="text-sm text-muted-foreground italic">Belum ada catatan. Tambahkan catatan pertama di atas.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {notes.map(note => (
                                    <div key={note.id} className="relative group p-4 border rounded-lg bg-card text-sm shadow-sm hover:shadow transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-semibold text-primary text-xs flex items-center gap-1.5">
                                                <CalendarDays className="h-3 w-3" />
                                                {format(new Date(note.date), 'dd MMMM yyyy', { locale: id })}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleDeleteNote(note.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                        <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                                            {note.note}
                                        </p>
                                        <div className="mt-3 text-[10px] text-muted-foreground/50 border-t pt-2">
                                            Ditulis oeh: {note.teacher?.name || 'Anda'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
