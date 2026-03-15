"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, CheckCircle2, Archive, ChevronRight, Undo2 } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface AcademicYear {
    id: number
    name: string
    start_date: string
    end_date: string
    is_active: boolean
}

interface GradeLog {
    id: number
    student: { public_id: string; name: string; nisn: string }
    from_classroom: { public_id: string; name: string; grade_level: number }
    to_classroom?: { public_id: string; name: string; grade_level: number } | null
    action: "promoted" | "demoted" | "archived"
}

interface Classroom {
    public_id: string
    name: string
    grade_level: number
}

export default function TahunAjaranPage() {
    const [years, setYears] = useState<AcademicYear[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Create dialog
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [formData, setFormData] = useState({ name: "", start_date: "", end_date: "" })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Close year dialog
    const [yearToClose, setYearToClose] = useState<AcademicYear | null>(null)
    const [isClosing, setIsClosing] = useState(false)

    // Grade-up results dialog
    const [gradeLogs, setGradeLogs] = useState<GradeLog[]>([])
    const [isLogsOpen, setIsLogsOpen] = useState(false)
    const [closedYearId, setClosedYearId] = useState<number | null>(null)

    // Demote dialog
    const [studentToDemote, setStudentToDemote] = useState<GradeLog | null>(null)
    const [classrooms, setClassrooms] = useState<Classroom[]>([])
    const [selectedClassroom, setSelectedClassroom] = useState("")
    const [isDemoting, setIsDemoting] = useState(false)
 
    // Suggestion logic
    const [suggestedYear, setSuggestedYear] = useState<{ name: string; start: string; end: string } | null>(null)
 
    useEffect(() => {
        if (isLoading) return
        const today = new Date()
        const currentYear = today.getFullYear()
        const threshold = new Date(currentYear, 6, 14) // July 14
        const cycleYear = today >= threshold ? currentYear : currentYear - 1
        const name = `${cycleYear}/${cycleYear + 1}`
 
        const exists = years.some(y => y.name === name)
        if (!exists) {
            setSuggestedYear({
                name,
                start: `${cycleYear}-07-15`,
                end: `${cycleYear + 1}-06-30`
            })
        } else {
            setSuggestedYear(null)
        }
    }, [years, isLoading])

    const fetchYears = useCallback(async () => {
        try {
            const res = await api.get("/academic-years")
            setYears(res.data.data || [])
        } catch {
            toast.error("Gagal memuat data tahun ajaran")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => { fetchYears() }, [fetchYears])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await api.post("/academic-years", formData)
            toast.success("Tahun ajaran berhasil dibuat")
            setIsCreateOpen(false)
            setFormData({ name: "", start_date: "", end_date: "" })
            fetchYears()
        } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Gagal membuat tahun ajaran")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleActivate = async (year: AcademicYear) => {
        try {
            await api.put(`/academic-years/${year.id}/activate`)
            toast.success(`${year.name} berhasil diaktifkan`)
            fetchYears()
        } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Gagal mengaktifkan tahun ajaran")
        }
    }

    const handleClose = async () => {
        if (!yearToClose) return
        setIsClosing(true)
        try {
            await api.post(`/academic-years/${yearToClose.id}/close`)
            toast.success("Tahun ajaran ditutup. Kenaikan kelas telah diproses.")
            setYearToClose(null)

            // Load grade logs for the just-closed year
            const logsRes = await api.get(`/academic-years/${yearToClose.id}/grade-logs`)
            setGradeLogs(logsRes.data.data || [])
            setClosedYearId(yearToClose.id)
            setIsLogsOpen(true)
            fetchYears()
        } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Gagal menutup tahun ajaran")
        } finally {
            setIsClosing(false)
        }
    }

    const openDemoteDialog = async (log: GradeLog) => {
        setStudentToDemote(log)
        setSelectedClassroom("")
        // Load available classrooms for the student's study program
        try {
            const res = await api.get(`/classrooms?study_program_filter=true`)
            setClassrooms(res.data.data || [])
        } catch {
            toast.error("Gagal memuat daftar kelas")
        }
    }

    const handleDemote = async () => {
        if (!studentToDemote || !selectedClassroom || !closedYearId) return
        setIsDemoting(true)
        try {
            await api.post(`/students/${studentToDemote.student.public_id}/demote`, {
                classroom_public_id: selectedClassroom,
                academic_year_id: closedYearId,
            })
            toast.success("Siswa berhasil dikembalikan ke kelas sebelumnya")
            setStudentToDemote(null)
            // Refresh grade logs
            const logsRes = await api.get(`/academic-years/${closedYearId}/grade-logs`)
            setGradeLogs(logsRes.data.data || [])
        } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Gagal memproses penurunan kelas")
        } finally {
            setIsDemoting(false)
        }
    }

    const actionBadge = (action: GradeLog["action"]) => {
        if (action === "promoted") return <Badge className="bg-green-100 text-green-800">Naik Kelas</Badge>
        if (action === "archived") return <Badge className="bg-gray-200 text-gray-700">Lulus/Arsip</Badge>
        return <Badge className="bg-amber-100 text-amber-800">Diturunkan</Badge>
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tahun Ajaran</h1>
                    <p className="text-muted-foreground">
                        Kelola tahun ajaran dan proses kenaikan kelas siswa secara otomatis.
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Buat Tahun Ajaran
                </Button>
            </div>

            <div className="border rounded-md bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Mulai</TableHead>
                            <TableHead>Selesai</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Memuat data...</TableCell>
                            </TableRow>
                        ) : years.length === 0 && !suggestedYear ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    Belum ada tahun ajaran. Buat yang pertama!
                                </TableCell>
                            </TableRow>
                        ) : (
                            <>
                                {suggestedYear && (
                                    <TableRow className="bg-amber-50/50 hover:bg-amber-50 border-amber-100">
                                        <TableCell className="font-semibold text-amber-900">
                                            <div className="flex items-center gap-2">
                                                {suggestedYear.name}
                                                <Badge className="bg-amber-100 text-amber-800 border-amber-200">Saran</Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-amber-800/70 italic">Belum dibuat</TableCell>
                                        <TableCell className="text-amber-800/70 italic">Belum dibuat</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="border-amber-300 text-amber-700">Tersedia</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                size="sm" 
                                                className="bg-amber-600 hover:bg-amber-700 text-white"
                                                onClick={() => {
                                                    setFormData({
                                                        name: suggestedYear.name,
                                                        start_date: suggestedYear.start,
                                                        end_date: suggestedYear.end
                                                    })
                                                    setIsCreateOpen(true)
                                                }}
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Buat Sekarang
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {years.map((year) => (
                                    <TableRow key={year.id}>
                                        <TableCell className="font-semibold">{year.name}</TableCell>
                                        <TableCell>{year.start_date}</TableCell>
                                        <TableCell>{year.end_date}</TableCell>
                                        <TableCell>
                                            {year.is_active
                                                ? <Badge className="bg-green-100 text-green-800">Aktif</Badge>
                                                : <Badge variant="secondary">Tidak Aktif</Badge>
                                            }
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {!year.is_active && (
                                                    <Button size="sm" variant="outline" onClick={() => handleActivate(year)}>
                                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                                        Aktifkan
                                                    </Button>
                                                )}
                                                {year.is_active && (
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => setYearToClose(year)}
                                                    >
                                                        <Archive className="h-4 w-4 mr-1" />
                                                        Tutup Tahun Ajaran
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Buat Tahun Ajaran Baru</DialogTitle>
                        <DialogDescription>
                            Isi nama dan rentang tanggal tahun ajaran.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nama Tahun Ajaran</Label>
                            <Input
                                id="name"
                                placeholder="Contoh: 2025/2026"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="start_date">Tanggal Mulai</Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="end_date">Tanggal Selesai</Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Menyimpan..." : "Simpan"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Close year confirmation */}
            <AlertDialog open={!!yearToClose} onOpenChange={(open) => !open && setYearToClose(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tutup Tahun Ajaran {yearToClose?.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ini akan memproses kenaikan kelas seluruh siswa aktif secara otomatis.
                            Siswa di kelas terakhir akan diarsipkan. Data presensi akan terhubung ke tahun ajaran ini.
                            <br /><br />
                            <strong>Tindakan ini tidak dapat dibatalkan kecuali via koreksi manual per siswa.</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleClose}
                            disabled={isClosing}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            {isClosing ? "Memproses..." : "Ya, Tutup dan Proses"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Grade-up results dialog */}
            <Dialog open={isLogsOpen} onOpenChange={setIsLogsOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Hasil Kenaikan Kelas</DialogTitle>
                        <DialogDescription>
                            Berikut adalah daftar siswa beserta hasil proses kenaikan kelas.
                            Anda dapat mengoreksi siswa yang tidak naik kelas melalui tombol di bawah.
                        </DialogDescription>
                    </DialogHeader>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Siswa</TableHead>
                                <TableHead>Dari Kelas</TableHead>
                                <TableHead></TableHead>
                                <TableHead>Ke Kelas</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {gradeLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                        Tidak ada data kenaikan kelas.
                                    </TableCell>
                                </TableRow>
                            ) : gradeLogs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{log.student.name}</p>
                                            <p className="text-xs text-muted-foreground">{log.student.nisn}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>{log.from_classroom.name}</TableCell>
                                    <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                                    <TableCell>{log.to_classroom?.name ?? "-"}</TableCell>
                                    <TableCell>{actionBadge(log.action)}</TableCell>
                                    <TableCell>
                                        {log.action === "promoted" && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                onClick={() => openDemoteDialog(log)}
                                            >
                                                <Undo2 className="h-4 w-4 mr-1" />
                                                Kembalikan
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </DialogContent>
            </Dialog>

            {/* Demote dialog */}
            <Dialog open={!!studentToDemote} onOpenChange={(open) => !open && setStudentToDemote(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Kembalikan Kelas Siswa</DialogTitle>
                        <DialogDescription>
                            Pilih kelas tujuan untuk <strong>{studentToDemote?.student.name}</strong>.
                            Siswa akan dipindahkan ke kelas yang dipilih.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        {classrooms.map((cls) => (
                            <label
                                key={cls.public_id}
                                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedClassroom === cls.public_id
                                    ? "border-primary bg-primary/5"
                                    : "hover:bg-muted/50"
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="classroom"
                                    value={cls.public_id}
                                    checked={selectedClassroom === cls.public_id}
                                    onChange={() => setSelectedClassroom(cls.public_id)}
                                    className="accent-primary"
                                />
                                <span className="font-medium">{cls.name}</span>
                                <Badge variant="outline" className="ml-auto">Kelas {cls.grade_level}</Badge>
                            </label>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setStudentToDemote(null)}>Batal</Button>
                        <Button
                            onClick={handleDemote}
                            disabled={!selectedClassroom || isDemoting}
                        >
                            {isDemoting ? "Memproses..." : "Konfirmasi"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
