"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    Plus, Trash2, Save, BookOpen, Loader2, Clock, Users, Pencil, Copy, Sparkles
} from "lucide-react"
import { AcademicYear } from "@/types"

// ─── Types ───────────────────────────────────────────────────────────────────

type SchoolPeriod = {
    id: number
    period_number: number
    start_time: string
    end_time: string
    is_break: boolean
    label: string | null
}

type Subject = {
    public_id: string
    name: string
    code: string | null
}

type Teacher = {
    public_id: string
    id: number
    name: string
    nip: string | null
}

type Classroom = {
    public_id: string
    id: number
    name: string
}

type CurriculumItem = {
    id: number
    academic_year_id: number
    classroom_id: number
    subject_id: number
    teacher_id: number
    hours_per_week: number
    subject?: Subject
    teacher?: Teacher
    classroom?: Classroom
}

type CurriculumSuggestion = {
    teacher_id: number
    teacher_name: string
    teacher_public_id: string
    assignment_subject_name: string
    suggested_subject_id: number | null
    suggested_subject_name: string | null
    suggested_subject_public_id: string | null
    hours_per_week: number
    // Form handling
    selected_subject_public_id?: string
}

type ApiError = {
    response?: { data?: { message?: string } }
}

function apiErrMsg(err: unknown, fallback: string): string {
    return (err as ApiError)?.response?.data?.message || fallback
}

// ─── Card 1: Konfigurasi Jam Sekolah ─────────────────────────────────────────

function SchoolPeriodsCard() {
    const [periods, setPeriods] = useState<SchoolPeriod[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isDirty, setIsDirty] = useState(false)

    const fetch = async () => {
        setIsLoading(true)
        try {
            const res = await api.get("/school-periods")
            setPeriods(res.data.data || [])
        } catch {
            toast.error("Gagal memuat jam sekolah")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => { fetch() }, [])

    const addPeriod = () => {
        const next = periods.length > 0 ? Math.max(...periods.map(p => p.period_number)) + 1 : 1
        setPeriods(prev => [
            ...prev,
            { id: -Date.now(), period_number: next, start_time: "", end_time: "", is_break: false, label: null },
        ])
        setIsDirty(true)
    }

    const removePeriod = (idx: number) => {
        setPeriods(prev => prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, period_number: i + 1 })))
        setIsDirty(true)
    }

    const update = (idx: number, field: keyof SchoolPeriod, value: unknown) => {
        setPeriods(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p))
        setIsDirty(true)
    }

    const handleSave = async () => {
        if (periods.some(p => !p.start_time || !p.end_time)) {
            toast.error("Semua jam mulai dan selesai harus diisi")
            return
        }
        setIsSaving(true)
        try {
            const payload = periods.map((p, i) => ({
                period_number: i + 1,
                start_time: p.start_time,
                end_time: p.end_time,
                is_break: p.is_break,
                label: p.label || null,
            }))
            const res = await api.post("/school-periods", { periods: payload })
            toast.success(res.data.message || "Jam sekolah berhasil disimpan")
            setIsDirty(false)
            fetch()
        } catch (err) {
            toast.error(apiErrMsg(err, "Gagal menyimpan jam sekolah"))
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" /> Konfigurasi Jam Sekolah
                        </CardTitle>
                        <CardDescription>
                            Konfigurasi ini digunakan oleh generator jadwal otomatis.
                        </CardDescription>
                    </div>
                    <Button size="sm" onClick={addPeriod} className="gap-1.5">
                        <Plus className="h-4 w-4" /> Tambah Periode
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">Jam ke-</TableHead>
                                        <TableHead>Label</TableHead>
                                        <TableHead>Mulai</TableHead>
                                        <TableHead>Selesai</TableHead>
                                        <TableHead className="w-24 text-center">Istirahat?</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {periods.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm">
                                                Belum ada jam sekolah. Klik &quot;Tambah Periode&quot; untuk memulai.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        periods.map((p, i) => (
                                            <TableRow key={p.id} className={p.is_break ? "bg-amber-50/50 dark:bg-amber-950/10" : undefined}>
                                                <TableCell className="font-medium text-center">{i + 1}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        placeholder={p.is_break ? "Istirahat" : `Jam ke-${i + 1}`}
                                                        value={p.label ?? ""}
                                                        onChange={e => update(i, "label", e.target.value || null)}
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="time"
                                                        lang="en-GB"
                                                        value={p.start_time}
                                                        onChange={e => update(i, "start_time", e.target.value)}
                                                        className="h-8 w-28"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="time"
                                                        lang="en-GB"
                                                        value={p.end_time}
                                                        onChange={e => update(i, "end_time", e.target.value)}
                                                        className="h-8 w-28"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Switch
                                                        checked={p.is_break}
                                                        onCheckedChange={v => update(i, "is_break", v)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive h-8 w-8 p-0"
                                                        onClick={() => removePeriod(i)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {isDirty && (
                            <Button onClick={handleSave} disabled={isSaving} className="gap-1.5">
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {isSaving ? "Menyimpan..." : "Simpan Konfigurasi"}
                            </Button>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}

// ─── Card 2: Kurikulum per Kelas ──────────────────────────────────────────────

type CurriculumItemFormData = {
    subject_public_id: string
    teacher_public_id: string
    hours_per_week: string
}

const EMPTY_ITEM_FORM: CurriculumItemFormData = { subject_public_id: "", teacher_public_id: "", hours_per_week: "2" }

function CurriculumItemsCard({ academicYears }: { academicYears: AcademicYear[] }) {
    const [selectedYearId, setSelectedYearId] = useState<string>("")
    const [selectedClassroomId, setSelectedClassroomId] = useState<string>("")

    const [classrooms, setClassrooms] = useState<Classroom[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [items, setItems] = useState<CurriculumItem[]>([])

    const [isLoadingItems, setIsLoadingItems] = useState(false)
    const [addOpen, setAddOpen] = useState(false)
    const [addForm, setAddForm] = useState<CurriculumItemFormData>(EMPTY_ITEM_FORM)
    const [isAdding, setIsAdding] = useState(false)
    const [editTarget, setEditTarget] = useState<CurriculumItem | null>(null)
    const [editForm, setEditForm] = useState<CurriculumItemFormData>(EMPTY_ITEM_FORM)
    const [isEditing, setIsEditing] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<CurriculumItem | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Copy Feature
    const [copyOpen, setCopyOpen] = useState(false)
    const [sourceClassroomId, setSourceClassroomId] = useState("")
    const [isCopying, setIsCopying] = useState(false)

    // Suggestion Feature
    const [suggestionOpen, setSuggestionOpen] = useState(false)
    const [suggestions, setSuggestions] = useState<CurriculumSuggestion[]>([])
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
    const [isSavingBulk, setIsSavingBulk] = useState(false)

    // Init selected year to active
    useEffect(() => {
        const active = academicYears.find(y => y.is_active)
        if (active) setSelectedYearId(String(active.id))
    }, [academicYears])

    // Load classrooms, subjects, teachers once
    useEffect(() => {
        api.get("/classrooms").then(r => setClassrooms(r.data.data || [])).catch(() => { })
        api.get("/subjects").then(r => setSubjects(r.data.data || [])).catch(() => { })
        api.get("/teachers").then(r => setTeachers(r.data.data || [])).catch(() => { })
    }, [])

    const fetchItems = useCallback(async () => {
        if (!selectedYearId || !selectedClassroomId) { setItems([]); return }
        setIsLoadingItems(true)
        try {
            const res = await api.get("/curriculum-items", {
                params: { academic_year_id: selectedYearId, classroom_public_id: selectedClassroomId }
            })
            setItems(res.data.data || [])
        } catch {
            toast.error("Gagal memuat kurikulum")
        } finally {
            setIsLoadingItems(false)
        }
    }, [selectedYearId, selectedClassroomId])

    useEffect(() => { fetchItems() }, [fetchItems])

    const handleAdd = async () => {
        if (!addForm.subject_public_id || !addForm.teacher_public_id || !addForm.hours_per_week) {
            toast.error("Semua field wajib diisi")
            return
        }
        setIsAdding(true)
        try {
            await api.post("/curriculum-items", {
                academic_year_id: Number(selectedYearId),
                classroom_public_id: selectedClassroomId,
                subject_public_id: addForm.subject_public_id,
                teacher_public_id: addForm.teacher_public_id,
                hours_per_week: Number(addForm.hours_per_week),
            })
            toast.success("Kurikulum berhasil ditambahkan")
            setAddOpen(false)
            setAddForm(EMPTY_ITEM_FORM)
            fetchItems()
        } catch (err) {
            toast.error(apiErrMsg(err, "Gagal menambah kurikulum"))
        } finally {
            setIsAdding(false)
        }
    }

    const openEdit = (item: CurriculumItem) => {
        setEditTarget(item)
        setEditForm({
            subject_public_id: item.subject?.public_id ?? "",
            teacher_public_id: item.teacher?.public_id ?? "",
            hours_per_week: String(item.hours_per_week),
        })
    }

    const handleEdit = async () => {
        if (!editTarget) return
        setIsEditing(true)
        try {
            await api.put(`/curriculum-items/${editTarget.id}`, {
                teacher_public_id: editForm.teacher_public_id,
                hours_per_week: Number(editForm.hours_per_week),
            })
            toast.success("Kurikulum berhasil diperbarui")
            setEditTarget(null)
            fetchItems()
        } catch (err) {
            toast.error(apiErrMsg(err, "Gagal memperbarui kurikulum"))
        } finally {
            setIsEditing(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setIsDeleting(true)
        try {
            await api.delete(`/curriculum-items/${deleteTarget.id}`)
            toast.success("Kurikulum berhasil dihapus")
            setDeleteTarget(null)
            fetchItems()
        } catch {
            toast.error("Gagal menghapus kurikulum")
        } finally {
            setIsDeleting(false)
        }
    }

    const handleCopy = async () => {
        if (!sourceClassroomId) {
            toast.error("Pilih kelas sumber")
            return
        }
        setIsCopying(true)
        try {
            const res = await api.post("/curriculum-items/copy", {
                academic_year_id: Number(selectedYearId),
                source_classroom_public_id: sourceClassroomId,
                target_classroom_public_id: selectedClassroomId
            })
            toast.success(res.data.message || "Kurikulum berhasil disalin")
            setCopyOpen(false)
            setSourceClassroomId("")
            fetchItems()
        } catch (err) {
            toast.error(apiErrMsg(err, "Gagal menyalin kurikulum"))
        } finally {
            setIsCopying(false)
        }
    }

    const fetchSuggestions = async () => {
        if (!selectedYearId || !selectedClassroomId) return
        setIsLoadingSuggestions(true)
        setSuggestionOpen(true)
        try {
            const res = await api.get("/curriculum-items/suggestions", {
                params: { academic_year_id: selectedYearId, classroom_public_id: selectedClassroomId }
            })
            const data: CurriculumSuggestion[] = res.data.data || []
            // Prep the selected_subject_public_id if suggestion found
            setSuggestions(data.map(s => ({
                ...s,
                selected_subject_public_id: s.suggested_subject_public_id || ""
            })))
        } catch {
            toast.error("Gagal memuat saran penugasan")
        } finally {
            setIsLoadingSuggestions(false)
        }
    }

    const handleBulkSave = async () => {
        const payload = suggestions
            .filter(s => s.selected_subject_public_id && s.hours_per_week > 0)
            .map(s => ({
                subject_public_id: s.selected_subject_public_id,
                teacher_public_id: s.teacher_public_id,
                hours_per_week: Number(s.hours_per_week)
            }))

        if (payload.length === 0) {
            toast.error("Tidak ada data valid untuk disimpan")
            return
        }

        setIsSavingBulk(true)
        try {
            const res = await api.post("/curriculum-items/bulk", {
                academic_year_id: Number(selectedYearId),
                classroom_public_id: selectedClassroomId,
                items: payload
            })
            toast.success(res.data.message || "Kurikulum berhasil disimpan")
            setSuggestionOpen(false)
            fetchItems()
        } catch (err) {
            toast.error(apiErrMsg(err, "Gagal menyimpan kurikulum massal"))
        } finally {
            setIsSavingBulk(false)
        }
    }

    const canAdd = !!selectedYearId && !!selectedClassroomId

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" /> Kurikulum per Kelas
                        </CardTitle>
                        <CardDescription>
                            Definisikan mata pelajaran, guru, dan jam pelajaran per minggu untuk setiap kelas.
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            disabled={!canAdd}
                            onClick={() => { setSourceClassroomId(""); setCopyOpen(true) }}
                        >
                            <Copy className="h-4 w-4" /> Salin Kurikulum
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="gap-1.5"
                            disabled={!canAdd}
                            onClick={fetchSuggestions}
                        >
                            <Sparkles className="h-4 w-4" /> Ambil dari Penugasan
                        </Button>
                        <Button
                            size="sm"
                            className="gap-1.5"
                            disabled={!canAdd}
                            onClick={() => { setAddForm(EMPTY_ITEM_FORM); setAddOpen(true) }}
                        >
                            <Plus className="h-4 w-4" /> Tambah Entri
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <Label className="shrink-0 text-sm">Tahun Ajaran</Label>
                        <Select value={selectedYearId} onValueChange={setSelectedYearId}>
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="Pilih tahun" />
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
                    <div className="flex items-center gap-2">
                        <Label className="shrink-0 text-sm">Kelas</Label>
                        <Select value={selectedClassroomId} onValueChange={setSelectedClassroomId}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Pilih kelas" />
                            </SelectTrigger>
                            <SelectContent>
                                {classrooms.map(c => (
                                    <SelectItem key={c.public_id} value={c.public_id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-md border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mata Pelajaran</TableHead>
                                <TableHead>Guru</TableHead>
                                <TableHead className="w-28 text-center">Jam/Minggu</TableHead>
                                <TableHead className="w-28 text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!selectedYearId || !selectedClassroomId ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground text-sm">
                                        Pilih tahun ajaran dan kelas untuk melihat kurikulum.
                                    </TableCell>
                                </TableRow>
                            ) : isLoadingItems ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground text-sm">
                                        Belum ada kurikulum untuk kelas ini.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.subject?.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{item.teacher?.name}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary">{item.hours_per_week} jam</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost" size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => openEdit(item)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost" size="sm"
                                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                    onClick={() => setDeleteTarget(item)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            {/* Add Dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah Entri Kurikulum</DialogTitle>
                        <DialogDescription>Pilih mata pelajaran, guru, dan jumlah jam per minggu.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid gap-2">
                            <Label>Mata Pelajaran <span className="text-destructive">*</span></Label>
                            <Select value={addForm.subject_public_id} onValueChange={v => setAddForm(f => ({ ...f, subject_public_id: v }))}>
                                <SelectTrigger><SelectValue placeholder="Pilih mata pelajaran" /></SelectTrigger>
                                <SelectContent>
                                    {subjects.map(s => <SelectItem key={s.public_id} value={s.public_id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Guru <span className="text-destructive">*</span></Label>
                            <Select value={addForm.teacher_public_id} onValueChange={v => setAddForm(f => ({ ...f, teacher_public_id: v }))}>
                                <SelectTrigger><SelectValue placeholder="Pilih guru" /></SelectTrigger>
                                <SelectContent>
                                    {teachers.map(t => <SelectItem key={t.public_id} value={t.public_id}>{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Jam per Minggu <span className="text-destructive">*</span></Label>
                            <Input
                                type="number" min="1" max="40"
                                value={addForm.hours_per_week}
                                onChange={e => setAddForm(f => ({ ...f, hours_per_week: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
                        <Button onClick={handleAdd} disabled={isAdding}>
                            {isAdding ? "Menyimpan..." : "Simpan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Entri Kurikulum</DialogTitle>
                        <DialogDescription>Perbarui guru atau jumlah jam per minggu.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid gap-2">
                            <Label>Mata Pelajaran <span className="text-destructive">*</span></Label>
                            <Select value={editForm.subject_public_id} onValueChange={v => setEditForm(f => ({ ...f, subject_public_id: v }))}>
                                <SelectTrigger><SelectValue placeholder="Pilih mata pelajaran" /></SelectTrigger>
                                <SelectContent>
                                    {subjects.map(s => <SelectItem key={s.public_id} value={s.public_id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Guru <span className="text-destructive">*</span></Label>
                            <Select value={editForm.teacher_public_id} onValueChange={v => setEditForm(f => ({ ...f, teacher_public_id: v }))}>
                                <SelectTrigger><SelectValue placeholder="Pilih guru" /></SelectTrigger>
                                <SelectContent>
                                    {teachers.map(t => <SelectItem key={t.public_id} value={t.public_id}>{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Jam per Minggu <span className="text-destructive">*</span></Label>
                            <Input
                                type="number" min="1" max="40"
                                value={editForm.hours_per_week}
                                onChange={e => setEditForm(f => ({ ...f, hours_per_week: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditTarget(null)}>Batal</Button>
                        <Button onClick={handleEdit} disabled={isEditing}>
                            {isEditing ? "Menyimpan..." : "Simpan Perubahan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Entri Kurikulum?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda akan menghapus <strong>{deleteTarget?.subject?.name}</strong> dari kurikulum kelas ini.
                            Tindakan ini tidak bisa dibatalkan.
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

            {/* Copy Dialog */}
            <Dialog open={copyOpen} onOpenChange={setCopyOpen}>
                <DialogContent className="md:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Salin Kurikulum</DialogTitle>
                        <DialogDescription>
                            Salin mata pelajaran dan guru dari kelas lain ke kelas <strong>{classrooms.find(c => c.public_id === selectedClassroomId)?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label>Pilih Kelas Sumber <span className="text-destructive">*</span></Label>
                            <Select value={sourceClassroomId} onValueChange={setSourceClassroomId}>
                                <SelectTrigger><SelectValue placeholder="Pilih kelas sumber..." /></SelectTrigger>
                                <SelectContent>
                                    {classrooms.filter(c => c.public_id !== selectedClassroomId).map(c => (
                                        <SelectItem key={c.public_id} value={c.public_id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCopyOpen(false)}>Batal</Button>
                        <Button onClick={handleCopy} disabled={isCopying || !sourceClassroomId}>
                            {isCopying ? "Menyalin..." : "Salin Sekarang"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Suggestions Dialog */}
            <Dialog open={suggestionOpen} onOpenChange={setSuggestionOpen}>
                <DialogContent className="md:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden text-token">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-amber-500" />
                            Ambil dari Penugasan Guru
                        </DialogTitle>
                        <DialogDescription>
                            Daftar di bawah ini adalah guru yang telah ditugaskan ke kelas ini. 
                            Silakan pilih mata pelajaran yang sesuai jika tidak otomatis terdeteksi.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-2">
                        {isLoadingSuggestions ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Menganalisis penugasan guru...</p>
                            </div>
                        ) : suggestions.length === 0 ? (
                            <div className="text-center py-12 border rounded-lg bg-muted/30">
                                <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                                <p className="text-sm font-medium">Tidak ada penugasan guru ditemukan</p>
                                <p className="text-xs text-muted-foreground mt-1 px-8">
                                    Pastikan Anda sudah mengatur penugasan guru mapel untuk kelas ini di menu Manajemen Guru.
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background z-10">
                                        <TableRow>
                                            <TableHead>Guru</TableHead>
                                            <TableHead>Teks Penugasan</TableHead>
                                            <TableHead>Mata Pelajaran (Database)</TableHead>
                                            <TableHead className="w-24 text-center">Jam/Mgg</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {suggestions.map((s, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium">{s.teacher_name}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground italic">
                                                    &quot;{s.assignment_subject_name}&quot;
                                                </TableCell>
                                                <TableCell>
                                                    <Select 
                                                        value={s.selected_subject_public_id} 
                                                        onValueChange={v => setSuggestions(prev => prev.map((p, i) => i === idx ? { ...p, selected_subject_public_id: v } : p))}
                                                    >
                                                        <SelectTrigger className={`h-8 ${!s.selected_subject_public_id ? 'border-amber-500 bg-amber-50/50' : ''}`}>
                                                            <SelectValue placeholder="Pilih mapel..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {subjects.map(subj => (
                                                                <SelectItem key={subj.public_id} value={subj.public_id}>
                                                                    {subj.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Input 
                                                        type="number" min="1" max="10"
                                                        value={s.hours_per_week}
                                                        onChange={e => setSuggestions(prev => prev.map((p, i) => i === idx ? { ...p, hours_per_week: Number(e.target.value) } : p))}
                                                        className="h-8 py-0"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-6 pt-2 bg-muted/30 border-t">
                        <Button variant="outline" onClick={() => setSuggestionOpen(false)} disabled={isSavingBulk}>
                            Batal
                        </Button>
                        <Button 
                            onClick={handleBulkSave} 
                            disabled={isSavingBulk || suggestions.length === 0}
                            className="gap-1.5"
                        >
                            {isSavingBulk ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Simpan Semua
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}

// ─── Card 3: Ketersediaan Guru ────────────────────────────────────────────────

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]

function TeacherUnavailabilityCard({ academicYears }: { academicYears: AcademicYear[] }) {
    const [selectedYearId, setSelectedYearId] = useState<string>("")
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>("")
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [periods, setPeriods] = useState<SchoolPeriod[]>([])
    // unavailable[day][period] = true
    const [unavailable, setUnavailable] = useState<Record<number, Record<number, boolean>>>({})
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const active = academicYears.find(y => y.is_active)
        if (active) setSelectedYearId(String(active.id))
    }, [academicYears])

    useEffect(() => {
        api.get("/teachers").then(r => setTeachers(r.data.data || [])).catch(() => { })
        api.get("/school-periods").then(r => setPeriods(r.data.data || [])).catch(() => { })
    }, [])

    const fetchUnavailabilities = useCallback(async () => {
        if (!selectedTeacherId || !selectedYearId) { setUnavailable({}); return }
        setIsLoading(true)
        try {
            const res = await api.get(`/teachers/${selectedTeacherId}/unavailabilities`, {
                params: { academic_year_id: selectedYearId }
            })
            const data: Array<{ day_of_week: number; period_number: number }> = res.data.data || []
            const map: Record<number, Record<number, boolean>> = {}
            for (const u of data) {
                if (!map[u.day_of_week]) map[u.day_of_week] = {}
                map[u.day_of_week][u.period_number] = true
            }
            setUnavailable(map)
        } catch {
            toast.error("Gagal memuat data ketersediaan guru")
        } finally {
            setIsLoading(false)
        }
    }, [selectedTeacherId, selectedYearId])

    useEffect(() => { fetchUnavailabilities() }, [fetchUnavailabilities])

    const toggle = (day: number, period: number) => {
        setUnavailable(prev => {
            const dayMap = { ...(prev[day] || {}) }
            if (dayMap[period]) {
                delete dayMap[period]
            } else {
                dayMap[period] = true
            }
            return { ...prev, [day]: dayMap }
        })
    }

    const handleSave = async () => {
        if (!selectedTeacherId || !selectedYearId) return
        setIsSaving(true)
        const entries: Array<{ day_of_week: number; period_number: number }> = []
        for (const [dayStr, periodMap] of Object.entries(unavailable)) {
            for (const [periodStr, val] of Object.entries(periodMap)) {
                if (val) entries.push({ day_of_week: Number(dayStr), period_number: Number(periodStr) })
            }
        }
        try {
            await api.post(`/teachers/${selectedTeacherId}/unavailabilities`, {
                academic_year_id: Number(selectedYearId),
                slots: entries,
            })
            toast.success("Ketersediaan guru berhasil disimpan")
        } catch (err) {
            toast.error(apiErrMsg(err, "Gagal menyimpan ketersediaan guru"))
        } finally {
            setIsSaving(false)
        }
    }

    const activePeriods = periods.filter(p => !p.is_break)

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" /> Ketersediaan Guru <span className="text-muted-foreground font-normal text-sm">(Opsional)</span>
                        </CardTitle>
                        <CardDescription>
                            Tandai slot di mana guru tidak tersedia. Generator jadwal akan menghindari slot ini.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <Label className="shrink-0 text-sm">Tahun Ajaran</Label>
                        <Select value={selectedYearId} onValueChange={setSelectedYearId}>
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="Pilih tahun" />
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
                    <div className="flex items-center gap-2">
                        <Label className="shrink-0 text-sm">Guru</Label>
                        <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                            <SelectTrigger className="w-52">
                                <SelectValue placeholder="Pilih guru" />
                            </SelectTrigger>
                            <SelectContent>
                                {teachers.map(t => (
                                    <SelectItem key={t.public_id} value={t.public_id}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Grid */}
                {!selectedTeacherId ? (
                    <div className="text-center py-8 text-sm text-muted-foreground border rounded-md">
                        Pilih guru untuk mengatur ketersediaannya.
                    </div>
                ) : periods.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground border rounded-md">
                        Tambahkan jam sekolah terlebih dahulu di Card 1.
                    </div>
                ) : isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <p className="text-xs text-muted-foreground mb-2">
                                Klik sel untuk menandai <span className="text-red-500 font-medium">tidak tersedia</span>. Sel merah = tidak bisa mengajar.
                            </p>
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr>
                                        <th className="border p-2 bg-muted text-left text-xs w-16">Jam ke-</th>
                                        {DAYS.map(d => (
                                            <th key={d} className="border p-2 bg-muted text-center text-xs">{d}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {activePeriods.map(p => (
                                        <tr key={p.period_number}>
                                            <td className="border p-2 text-center text-xs text-muted-foreground font-medium">
                                                {p.period_number}
                                                {p.start_time && (
                                                    <div className="text-[10px] text-muted-foreground/60">{p.start_time.slice(0, 5)}</div>
                                                )}
                                            </td>
                                            {[1, 2, 3, 4, 5].map(day => {
                                                const isUnavailable = !!unavailable[day]?.[p.period_number]
                                                return (
                                                    <td
                                                        key={day}
                                                        className={`border p-2 text-center cursor-pointer transition-colors select-none ${isUnavailable
                                                            ? "bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-medium"
                                                            : "hover:bg-muted/50"
                                                            }`}
                                                        onClick={() => toggle(day, p.period_number)}
                                                        title={isUnavailable ? "Tidak tersedia — klik untuk hapus" : "Tersedia — klik untuk tandai tidak tersedia"}
                                                    >
                                                        {isUnavailable ? "✕" : ""}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Button onClick={handleSave} disabled={isSaving} className="gap-1.5">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {isSaving ? "Menyimpan..." : "Simpan Ketersediaan"}
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KurikulumPage() {
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])

    useEffect(() => {
        api.get("/academic-years").then(res => {
            setAcademicYears(res.data.data || [])
        }).catch(() => {
            toast.error("Gagal memuat tahun ajaran")
        })
    }, [])

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <BookOpen className="h-6 w-6" /> Kurikulum
                </h1>
                <p className="text-muted-foreground mt-1">
                    Konfigurasi data kurikulum sebagai fondasi generator jadwal otomatis.
                </p>
            </div>

            <SchoolPeriodsCard />
            <CurriculumItemsCard academicYears={academicYears} />
            <TeacherUnavailabilityCard academicYears={academicYears} />
        </div>
    )
}
