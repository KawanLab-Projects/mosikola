"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { api } from "@/lib/api"
import { Teacher, TeacherAssignment, AcademicYear, Classroom, Subject } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Pencil, Trash2, GraduationCap, BookOpen, X, UserPlus, Search, UserCheck } from "lucide-react"
import { toast } from "sonner"

// ─── Constants ───────────────────────────────────────────────────────────────

type TeacherForm = { name: string; nip: string; email?: string }
const EMPTY_FORM: TeacherForm = { name: "", nip: "", email: "" }

const ASSIGNMENT_TYPES = [
    { value: "wali_kelas", label: "Wali Kelas" },
    { value: "guru_bk", label: "Guru BK" },
    { value: "guru_mapel", label: "Guru Mapel" },
    { value: "guru_wali", label: "Guru Wali" },
] as const

type AssignmentType = "wali_kelas" | "guru_bk" | "guru_mapel" | "guru_wali"

const ASSIGNMENT_BADGE: Record<AssignmentType, { label: string; className: string }> = {
    wali_kelas: { label: "Wali Kelas", className: "bg-blue-100 text-blue-700" },
    guru_bk: { label: "Guru BK", className: "bg-purple-100 text-purple-700" },
    guru_mapel: { label: "Guru Mapel", className: "bg-green-100 text-green-700" },
    guru_wali: { label: "Guru Wali", className: "bg-amber-100 text-amber-700" },
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GuruPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
    const [classrooms, setClassrooms] = useState<Classroom[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Add dialog
    const [addOpen, setAddOpen] = useState(false)
    const [addForm, setAddForm] = useState<TeacherForm>(EMPTY_FORM)
    const [isAdding, setIsAdding] = useState(false)

    // Edit dialog
    const [editTarget, setEditTarget] = useState<Teacher | null>(null)
    const [editForm, setEditForm] = useState<TeacherForm>(EMPTY_FORM)
    const [isEditing, setIsEditing] = useState(false)

    // Delete dialog
    const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Assignment panel
    const [assignTarget, setAssignTarget] = useState<Teacher | null>(null)
    const [assignments, setAssignments] = useState<TeacherAssignment[]>([])
    const [isLoadingAssignments, setIsLoadingAssignments] = useState(false)

    // Add assignment form
    const [assignForm, setAssignForm] = useState({
        classroom_id: "",
        academic_year_id: "",
        assignment_type: "" as AssignmentType | "",
        subject: "",
    })
    const [isAddingAssignment, setIsAddingAssignment] = useState(false)
    const [guruWaliStudents, setGuruWaliStudents] = useState<{ id: number; name: string; class: string }[]>([])
    const [studentSearchQuery, setStudentSearchQuery] = useState("")
    const [studentSuggestions, setStudentSuggestions] = useState<{ id: number; name: string; class: string }[]>([])
    const [isSearchingStudents, setIsSearchingStudents] = useState(false)
    const studentSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Delete assignment
    const [deleteAssignmentTarget, setDeleteAssignmentTarget] = useState<TeacherAssignment | null>(null)
    const [isDeletingAssignment, setIsDeletingAssignment] = useState(false)

    // Attach user account
    const [attachTarget, setAttachTarget] = useState<Teacher | null>(null)
    const [attachForm, setAttachForm] = useState({ email: "", password: "" })
    const [isAttaching, setIsAttaching] = useState(false)
    // "search" = find existing user, "create" = make new account
    const [attachMode, setAttachMode] = useState<"search" | "create">("search")
    const [userSearchQuery, setUserSearchQuery] = useState("")
    const [userSuggestions, setUserSuggestions] = useState<{ id: number; email: string; name: string }[]>([])
    const [isSearchingUsers, setIsSearchingUsers] = useState(false)
    const [isLinking, setIsLinking] = useState(false)
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // ── Fetch ─────────────────────────────────────────────────────────────────

    const fetchTeachers = useCallback(async () => {
        setIsLoading(true)
        try {
            const res = await api.get("/teachers")
            setTeachers(res.data.data)
        } catch {
            toast.error("Gagal memuat data guru")
        } finally {
            setIsLoading(false)
        }
    }, [])

    const fetchSupport = useCallback(async () => {
        try {
            const [yearsRes, classroomsRes, subjectsRes] = await Promise.all([
                api.get("/academic-years"),
                api.get("/classrooms"),
                api.get("/subjects"),
            ])
            setAcademicYears(yearsRes.data.data || [])
            setClassrooms(classroomsRes.data.data || [])
            setSubjects(subjectsRes.data.data || [])
        } catch {
            // Non-fatal: selects just stay empty
        }
    }, [])

    useEffect(() => {
        fetchTeachers()
        fetchSupport()
    }, [fetchTeachers, fetchSupport])

    // ── Teacher CRUD ──────────────────────────────────────────────────────────

    const handleAdd = async () => {
        if (!addForm.name.trim() || !addForm.email?.trim()) {
            toast.error("Nama dan Email wajib diisi")
            return
        }
        setIsAdding(true)
        try {
            await api.post("/teachers", addForm)
            toast.success("Guru berhasil ditambahkan")
            setAddOpen(false)
            setAddForm(EMPTY_FORM)
            fetchTeachers()
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            toast.error(msg || "Gagal menambahkan guru")
        } finally {
            setIsAdding(false)
        }
    }

    const openEdit = (teacher: Teacher) => {
        setEditTarget(teacher)
        setEditForm({ name: teacher.name, nip: teacher.nip || "" })
    }

    const handleEdit = async () => {
        if (!editTarget) return
        setIsEditing(true)
        try {
            await api.put(`/teachers/${editTarget.public_id}`, editForm)
            toast.success("Data guru berhasil diperbarui")
            setEditTarget(null)
            fetchTeachers()
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            toast.error(msg || "Gagal memperbarui guru")
        } finally {
            setIsEditing(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setIsDeleting(true)
        try {
            await api.delete(`/teachers/${deleteTarget.public_id}`)
            toast.success("Guru berhasil dihapus")
            setDeleteTarget(null)
            fetchTeachers()
        } catch {
            toast.error("Gagal menghapus guru")
        } finally {
            setIsDeleting(false)
        }
    }

    // ── Assignments ───────────────────────────────────────────────────────────

    // Debounced student search for Guru Wali assignment
    useEffect(() => {
        if (studentSearchTimerRef.current) clearTimeout(studentSearchTimerRef.current)
        if (assignForm.assignment_type !== "guru_wali" || studentSearchQuery.length < 2) {
            setStudentSuggestions([])
            return
        }
        setIsSearchingStudents(true)
        studentSearchTimerRef.current = setTimeout(async () => {
            try {
                // Fetch students matching name, limit results
                const res = await api.get("/students", { params: { search: studentSearchQuery, limit: 10 } })
                const mapped = (res.data.data || res.data || []).map((s: { public_id?: number, id: number, name: string, classroom?: { name: string } }) => ({
                    id: s.public_id || s.id,
                    name: s.name,
                    class: s.classroom?.name || "-"
                }))
                setStudentSuggestions(mapped)
            } catch { /* silent */ } finally {
                setIsSearchingStudents(false)
            }
        }, 350)
        return () => { if (studentSearchTimerRef.current) clearTimeout(studentSearchTimerRef.current) }
    }, [studentSearchQuery, assignForm.assignment_type])

    const openAssignPanel = async (teacher: Teacher) => {
        setAssignTarget(teacher)
        setAssignForm({ classroom_id: "", academic_year_id: "", assignment_type: "", subject: "" })
        setGuruWaliStudents([])
        setStudentSearchQuery("")
        setStudentSuggestions([])
        setIsLoadingAssignments(true)
        try {
            const res = await api.get(`/teachers/${teacher.public_id}/assignments`)
            setAssignments(res.data.data)
        } catch {
            toast.error("Gagal memuat penugasan")
        } finally {
            setIsLoadingAssignments(false)
        }
    }

    const handleAddAssignment = async () => {
        if (!assignTarget) return
        if (!assignForm.academic_year_id || !assignForm.assignment_type) {
            toast.error("Tahun Ajaran dan Jenis Penugasan wajib diisi")
            return
        }

        if (assignForm.assignment_type === "guru_wali") {
            if (guruWaliStudents.length === 0) {
                toast.error("Pilih minimal satu siswa untuk Guru Wali")
                return
            }
            setIsAddingAssignment(true)
            try {
                const studentIds = guruWaliStudents.map(s => s.id)
                await api.post(`/teachers/${assignTarget.public_id}/guru-wali-assignments`, {
                    academic_year_id: Number(assignForm.academic_year_id),
                    student_ids: studentIds,
                })
                toast.success("Penugasan Guru Wali berhasil disimpan")
                setAssignForm({ ...assignForm, assignment_type: "" })
                setGuruWaliStudents([])
                // Refresh list later when showing Guru Wali assignments in the table, for now we just show success
            } catch (err: unknown) {
                const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                toast.error(msg || "Gagal menyimpan penugasan Guru Wali")
            } finally {
                setIsAddingAssignment(false)
            }
            return
        }

        // Standard assignments
        if (!assignForm.classroom_id) {
            toast.error("Kelas wajib diisi")
            return
        }
        if (assignForm.assignment_type === "guru_mapel" && !assignForm.subject.trim()) {
            toast.error("Mata pelajaran wajib diisi untuk Guru Mapel")
            return
        }
        setIsAddingAssignment(true)
        try {
            await api.post(`/teachers/${assignTarget.public_id}/assignments`, {
                classroom_id: assignForm.classroom_id,
                academic_year_id: Number(assignForm.academic_year_id),
                assignment_type: assignForm.assignment_type,
                subject: assignForm.assignment_type === "guru_mapel" ? assignForm.subject : null,
            })
            toast.success("Penugasan berhasil ditambahkan")
            setAssignForm({ classroom_id: "", academic_year_id: "", assignment_type: "", subject: "" })
            // Refresh list
            const res = await api.get(`/teachers/${assignTarget.public_id}/assignments`)
            setAssignments(res.data.data)
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            toast.error(msg || "Gagal menambahkan penugasan")
        } finally {
            setIsAddingAssignment(false)
        }
    }

    const handleDeleteAssignment = async () => {
        if (!assignTarget || !deleteAssignmentTarget) return
        setIsDeletingAssignment(true)
        try {
            await api.delete(`/teachers/${assignTarget.public_id}/assignments/${deleteAssignmentTarget.id}`)
            toast.success("Penugasan berhasil dihapus")
            setDeleteAssignmentTarget(null)
            const res = await api.get(`/teachers/${assignTarget.public_id}/assignments`)
            setAssignments(res.data.data)
        } catch {
            toast.error("Gagal menghapus penugasan")
        } finally {
            setIsDeletingAssignment(false)
        }
    }

    // ── Attach user ─────────────────────────────────────────────────────────

    // Debounced user search
    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
        if (userSearchQuery.length < 2) { setUserSuggestions([]); return }
        setIsSearchingUsers(true)
        searchTimerRef.current = setTimeout(async () => {
            try {
                const res = await api.get("/teachers/users/search", { params: { email: userSearchQuery } })
                setUserSuggestions(res.data.data || [])
            } catch { /* silent */ } finally {
                setIsSearchingUsers(false)
            }
        }, 350)
        return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
    }, [userSearchQuery])

    const openAttachDialog = (teacher: Teacher) => {
        setAttachTarget(teacher)
        setAttachForm({ email: "", password: "" })
        setAttachMode("search")
        setUserSearchQuery("")
        setUserSuggestions([])
    }

    const handleLinkUser = async (userId: number) => {
        if (!attachTarget) return
        setIsLinking(true)
        try {
            await api.post(`/teachers/${attachTarget.public_id}/link-user`, { user_id: userId })
            toast.success(`Akun berhasil dihubungkan ke ${attachTarget.name}`)
            setAttachTarget(null)
            fetchTeachers()
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            toast.error(msg || "Gagal menghubungkan akun")
        } finally {
            setIsLinking(false)
        }
    }

    const handleAttachUser = async () => {
        if (!attachTarget) return
        if (!attachForm.email || !attachForm.password) {
            toast.error("Email dan password wajib diisi")
            return
        }
        setIsAttaching(true)
        try {
            await api.post(`/teachers/${attachTarget.public_id}/attach-user`, attachForm)
            toast.success(`Akun berhasil dibuat untuk ${attachTarget.name}`)
            setAttachTarget(null)
            setAttachForm({ email: "", password: "" })
            fetchTeachers()
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            toast.error(msg || "Gagal membuat akun")
        } finally {
            setIsAttaching(false)
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <GraduationCap className="h-6 w-6" />
                        Manajemen Guru
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Kelola data guru dan penugasan mengajar di sekolah Anda.
                    </p>
                </div>

                {/* Add Teacher Dialog */}
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Tambah Guru
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tambah Guru Baru</DialogTitle>
                            <DialogDescription>
                                Isi informasi guru untuk mendapatkan akses ke dalam sistem.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="grid gap-2">
                                <Label htmlFor="add-name">Nama Lengkap <span className="text-destructive">*</span></Label>
                                <Input
                                    id="add-name"
                                    placeholder="Contoh: Budi Santoso, S.Pd."
                                    value={addForm.name}
                                    onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="add-email">Email <span className="text-destructive">*</span></Label>
                                <Input
                                    id="add-email"
                                    type="email"
                                    placeholder="Contoh: guru@sekolah.com"
                                    value={addForm.email || ""}
                                    onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="add-nip">NIP / Identitas Lain</Label>
                                <Input
                                    id="add-nip"
                                    placeholder="Contoh: 198001012005011001"
                                    value={addForm.nip}
                                    onChange={e => setAddForm(f => ({ ...f, nip: e.target.value }))}
                                />
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Bisa diisi NIP, tanggal lahir (format: YYYYMMDD), atau info lainnya. <br />
                                    Default password guru adalah isian kolom ini. Jika dikosongkan, default password adalah <strong>mosikola@1234</strong>.
                                </p>
                            </div>
                        </div>
                        <Separator />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
                            <Button onClick={handleAdd} disabled={isAdding}>
                                {isAdding ? "Menyimpan..." : "Simpan"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Teacher Table */}
            <div className="rounded-md border bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Guru</TableHead>
                            <TableHead>NIP</TableHead>
                            <TableHead>Email / Akun</TableHead>
                            <TableHead>Penugasan</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                    Memuat data guru...
                                </TableCell>
                            </TableRow>
                        ) : teachers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <GraduationCap className="h-8 w-8 opacity-30" />
                                        <p>Belum ada data guru. Klik &quot;Tambah Guru&quot; untuk memulai.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            teachers.map(teacher => (
                                <TableRow key={teacher.public_id}>
                                    <TableCell className="font-medium">{teacher.name}</TableCell>
                                    <TableCell className="text-muted-foreground font-mono text-sm">
                                        {teacher.nip ?? <span className="italic text-xs">—</span>}
                                    </TableCell>
                                    <TableCell>
                                        {teacher.has_user ? (
                                            <span className="text-sm text-muted-foreground">{teacher.email}</span>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 gap-1 text-amber-600 border-amber-300 hover:bg-amber-50"
                                                onClick={() => openAttachDialog(teacher)}
                                            >
                                                <UserPlus className="h-3 w-3" /> Buat Akun
                                            </Button>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {teacher.assignments && teacher.assignments.length > 0 ? (
                                                teacher.assignments.slice(0, 3).map(a => {
                                                    const meta = ASSIGNMENT_BADGE[a.assignment_type]
                                                    return (
                                                        <Badge key={a.id} className={meta.className}>
                                                            {meta.label}
                                                            {a.assignment_type === "guru_mapel" && a.subject
                                                                ? ` · ${a.subject}`
                                                                : ""}
                                                        </Badge>
                                                    )
                                                })
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">
                                                    Belum ada penugasan
                                                </span>
                                            )}
                                            {(teacher.assignments?.length ?? 0) > 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{(teacher.assignments?.length ?? 0) - 3} lainnya
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1"
                                                onClick={() => openAssignPanel(teacher)}
                                            >
                                                <BookOpen className="h-3.5 w-3.5" /> Tugaskan
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1"
                                                onClick={() => openEdit(teacher)}
                                            >
                                                <Pencil className="h-3.5 w-3.5" /> Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1 text-destructive hover:text-destructive"
                                                onClick={() => setDeleteTarget(teacher)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" /> Hapus
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* ── Edit Dialog ─────────────────────────────────────────────── */}
            <Dialog open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Data Guru</DialogTitle>
                        <DialogDescription>Perbarui nama atau NIP guru.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Nama Lengkap</Label>
                            <Input
                                id="edit-name"
                                value={editForm.name}
                                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-nip">NIP</Label>
                            <Input
                                id="edit-nip"
                                value={editForm.nip}
                                onChange={e => setEditForm(f => ({ ...f, nip: e.target.value }))}
                            />
                        </div>
                    </div>
                    <Separator />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditTarget(null)}>Batal</Button>
                        <Button onClick={handleEdit} disabled={isEditing}>
                            {isEditing ? "Menyimpan..." : "Simpan Perubahan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete Alert ─────────────────────────────────────────────── */}
            <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Guru?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda akan menghapus <strong>{deleteTarget?.name}</strong>. Semua penugasan guru ini juga akan ikut terhapus. Tindakan ini tidak bisa dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Menghapus..." : "Hapus"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Assignment Manager Dialog ────────────────────────────────── */}
            <Dialog open={!!assignTarget} onOpenChange={open => !open && setAssignTarget(null)}>
                <DialogContent className="max-w-4xl sm:max-w-4xl md:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Penugasan — {assignTarget?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Tambah atau hapus penugasan guru ini. Satu guru dapat memiliki beberapa penugasan sekaligus.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Add Assignment Form */}
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                        <p className="text-sm font-semibold">Tambah Penugasan Baru</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label className="text-xs">Jenis Penugasan</Label>
                                <Select
                                    value={assignForm.assignment_type}
                                    onValueChange={v => setAssignForm(f => ({
                                        ...f,
                                        assignment_type: v as AssignmentType,
                                        subject: "",
                                    }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih jenis..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ASSIGNMENT_TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-1.5">
                                <Label className="text-xs">Tahun Ajaran</Label>
                                <Select
                                    value={assignForm.academic_year_id}
                                    onValueChange={v => {
                                        setAssignForm(f => ({ ...f, academic_year_id: v }))
                                        // Auto-fetch existing guru_wali assignments if that type is selected
                                        if (assignForm.assignment_type === "guru_wali" && assignTarget) {
                                            api.get(`/teachers/${assignTarget.public_id}/guru-wali-assignments`, { params: { academic_year_id: v } })
                                                .then(res => {
                                                    const existing = (res.data.data || []).map((a: { student?: { public_id: number; name: string; classroom?: { name: string } } }) => ({
                                                        id: a.student?.public_id,
                                                        name: a.student?.name || "Unknown",
                                                        class: a.student?.classroom?.name || "-"
                                                    }))
                                                    setGuruWaliStudents(existing)
                                                })
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih tahun..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {academicYears.map(y => (
                                            <SelectItem key={y.id} value={String(y.id)}>
                                                {y.name}{y.is_active ? " (Aktif)" : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {assignForm.assignment_type !== "guru_wali" && (
                                <div className="grid gap-1.5">
                                    <Label className="text-xs">Kelas</Label>
                                    <Select
                                        value={assignForm.classroom_id}
                                        onValueChange={v => setAssignForm(f => ({ ...f, classroom_id: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih kelas..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classrooms.map(c => (
                                                <SelectItem key={c.public_id} value={c.public_id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            {assignForm.assignment_type === "guru_mapel" && (
                                <div className="grid gap-1.5">
                                    <Label className="text-xs">Mata Pelajaran</Label>
                                    <Select
                                        value={assignForm.subject}
                                        onValueChange={v => setAssignForm(f => ({ ...f, subject: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih mata pelajaran..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subjects.map(s => (
                                                <SelectItem key={s.public_id} value={s.name}>
                                                    {s.code ? `${s.code} — ${s.name}` : s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        {/* Guru Wali Students Multi-Select Dropdown */}
                        {assignForm.assignment_type === "guru_wali" && (
                            <div className="grid gap-2 mt-2">
                                <Label className="text-xs">Pilih Siswa Lintas Kelas</Label>

                                <div className="min-h-[40px] w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm flex flex-wrap gap-2 items-center">
                                    {guruWaliStudents.map(s => (
                                        <Badge key={s.id} variant="secondary" className="gap-1 px-2 py-0.5 whitespace-nowrap">
                                            {s.name} <span className="opacity-50 text-[10px] ml-1">({s.class})</span>
                                            <X
                                                className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                                                onClick={() => setGuruWaliStudents(prev => prev.filter(x => x.id !== s.id))}
                                            />
                                        </Badge>
                                    ))}
                                    <Input
                                        className="h-7 border-0 p-0 focus-visible:ring-0 shadow-none flex-1 min-w-[150px] bg-transparent text-sm"
                                        placeholder={guruWaliStudents.length === 0 ? "Ketik nama siswa..." : "Tambah siswa..."}
                                        value={studentSearchQuery}
                                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                                        disabled={!assignForm.academic_year_id}
                                    />
                                </div>
                                {!assignForm.academic_year_id && (
                                    <p className="text-xs text-muted-foreground">Pilih Tahun Ajaran terlebih dahulu sebelum memilih siswa.</p>
                                )}

                                {/* Student Search Results Dropdown */}
                                {studentSearchQuery.length >= 2 && (
                                    <div className="border rounded-md overflow-hidden bg-background shadow-md max-h-48 overflow-y-auto">
                                        {isSearchingStudents ? (
                                            <p className="text-xs text-center text-muted-foreground py-2">Mencari siswa...</p>
                                        ) : studentSuggestions.length === 0 ? (
                                            <p className="text-xs text-center text-muted-foreground py-2 italic">Tidak ditemukan.</p>
                                        ) : (
                                            <ul className="divide-y text-sm">
                                                {studentSuggestions.map(s => {
                                                    const isSelected = guruWaliStudents.some(x => x.id === s.id)
                                                    return (
                                                        <li
                                                            key={s.id}
                                                            className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                                                            onClick={() => {
                                                                if (!isSelected) {
                                                                    setGuruWaliStudents(prev => [...prev, s])
                                                                }
                                                                setStudentSearchQuery("")
                                                                setStudentSuggestions([])
                                                            }}
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="font-medium truncate">{s.name}</p>
                                                                <p className="text-[10px] text-muted-foreground truncate">Kelas: {s.class}</p>
                                                            </div>
                                                            {isSelected ? (
                                                                <UserCheck className="h-4 w-4 text-primary shrink-0" />
                                                            ) : (
                                                                <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                                                            )}
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={handleAddAssignment}
                            disabled={isAddingAssignment}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            {isAddingAssignment ? "Menyimpan..." : "Tambah Penugasan"}
                        </Button>
                    </div>

                    <Separator />

                    {/* Existing Assignments List */}
                    <div className="space-y-2">
                        <p className="text-sm font-semibold">Penugasan Saat Ini</p>
                        {isLoadingAssignments ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">Memuat...</p>
                        ) : assignments.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center italic">
                                Belum ada penugasan untuk guru ini.
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {assignments.map(a => {
                                    const meta = ASSIGNMENT_BADGE[a.assignment_type]
                                    return (
                                        <div
                                            key={a.id}
                                            className="flex items-center justify-between rounded-md border px-3 py-2 bg-background"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Badge className={`${meta.className} shrink-0`}>{meta.label}</Badge>
                                                <span className="text-sm font-medium truncate">
                                                    {a.classroom?.name ?? "—"}
                                                </span>
                                                {a.subject && (
                                                    <span className="text-xs text-muted-foreground truncate">
                                                        · {a.subject}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-xs text-muted-foreground">
                                                    {a.academic_year?.name}
                                                </span>
                                                {a.assignment_type !== 'guru_wali' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                        onClick={() => setDeleteAssignmentTarget(a)}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignTarget(null)}>Tutup</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete Assignment Alert ───────────────────────────────────── */}
            <AlertDialog
                open={!!deleteAssignmentTarget}
                onOpenChange={open => !open && setDeleteAssignmentTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Penugasan?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteAssignmentTarget && (
                                <>
                                    Hapus penugasan{" "}
                                    <strong>
                                        {ASSIGNMENT_BADGE[deleteAssignmentTarget.assignment_type].label}
                                    </strong>
                                    {deleteAssignmentTarget.subject && ` (${deleteAssignmentTarget.subject})`}
                                    {" "}di kelas{" "}
                                    <strong>{deleteAssignmentTarget.classroom?.name}</strong>?
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingAssignment}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteAssignment}
                            disabled={isDeletingAssignment}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeletingAssignment ? "Menghapus..." : "Hapus"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Attach User Account Dialog — two-mode: search existing OR create new */}
            <Dialog open={!!attachTarget} onOpenChange={open => !open && setAttachTarget(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            Hubungkan Akun — {attachTarget?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Cari akun yang sudah ada dan hubungkan, atau buat akun baru untuk guru ini.
                        </DialogDescription>
                    </DialogHeader>

                    {attachMode === "search" ? (
                        <div className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="user-search">Cari Email yang Sudah Ada</Label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="user-search"
                                        className="pl-8"
                                        placeholder="Ketik email untuk mencari..."
                                        value={userSearchQuery}
                                        onChange={e => setUserSearchQuery(e.target.value)}
                                        autoComplete="off"
                                    />
                                </div>
                            </div>

                            {/* Suggestions list */}
                            {userSearchQuery.length >= 2 && (
                                <div className="border rounded-md overflow-hidden">
                                    {isSearchingUsers ? (
                                        <p className="text-sm text-center text-muted-foreground py-4">Mencari...</p>
                                    ) : userSuggestions.length === 0 ? (
                                        <p className="text-sm text-center text-muted-foreground py-4 italic">Tidak ada akun yang cocok.</p>
                                    ) : (
                                        <ul className="divide-y">
                                            {userSuggestions.map(u => (
                                                <li key={u.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">{u.email}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{u.name}</p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="shrink-0 gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                                        onClick={() => handleLinkUser(u.id)}
                                                        disabled={isLinking}
                                                    >
                                                        <UserCheck className="h-3.5 w-3.5" />
                                                        {isLinking ? "Menghubungkan..." : "Hubungkan"}
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}

                            <Separator />
                            <p className="text-sm text-center text-muted-foreground">
                                Tidak ada akun yang cocok?{" "}
                                <button
                                    type="button"
                                    className="font-medium text-primary underline-offset-4 hover:underline"
                                    onClick={() => { setAttachMode("create"); setUserSearchQuery(""); setUserSuggestions([]) }}
                                >
                                    Buat user baru
                                </button>
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="attach-email">Email</Label>
                                <Input
                                    id="attach-email"
                                    type="email"
                                    placeholder="guru@sekolah.sch.id"
                                    value={attachForm.email}
                                    onChange={e => setAttachForm(f => ({ ...f, email: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="attach-password">Password</Label>
                                <Input
                                    id="attach-password"
                                    type="password"
                                    placeholder="Minimal 6 karakter"
                                    value={attachForm.password}
                                    onChange={e => setAttachForm(f => ({ ...f, password: e.target.value }))}
                                />
                            </div>
                            <button
                                type="button"
                                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                                onClick={() => setAttachMode("search")}
                            >
                                ← Kembali ke pencarian
                            </button>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAttachTarget(null)} disabled={isAttaching || isLinking}>
                            Batal
                        </Button>
                        {attachMode === "create" && (
                            <Button onClick={handleAttachUser} disabled={isAttaching}>
                                {isAttaching ? "Membuat..." : "Buat Akun"}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
