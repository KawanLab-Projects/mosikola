"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Search, BookOpen } from "lucide-react"
import { api } from "@/lib/api"
import { Subject, SubjectInput } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

// ─── Constants ───────────────────────────────────────────────────────────────

const EMPTY_FORM: SubjectInput = { name: "", code: "" }

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MataPelajaranPage() {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Add dialog
    const [addOpen, setAddOpen] = useState(false)
    const [addForm, setAddForm] = useState<SubjectInput>(EMPTY_FORM)
    const [isAdding, setIsAdding] = useState(false)

    // Edit dialog
    const [editTarget, setEditTarget] = useState<Subject | null>(null)
    const [editForm, setEditForm] = useState<SubjectInput>(EMPTY_FORM)
    const [isEditing, setIsEditing] = useState(false)

    // Delete dialog
    const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // ── Fetch ─────────────────────────────────────────────────────────────────

    const fetchSubjects = async () => {
        setIsLoading(true)
        try {
            const res = await api.get("/subjects")
            setSubjects(res.data.data || [])
        } catch {
            toast.error("Gagal memuat data mata pelajaran")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchSubjects()
    }, [])

    // ── CRUD Handlers ─────────────────────────────────────────────────────────

    const handleAdd = async () => {
        if (!addForm.name.trim()) {
            toast.error("Nama mata pelajaran wajib diisi")
            return
        }
        setIsAdding(true)
        try {
            await api.post("/subjects", {
                name: addForm.name.trim(),
                code: addForm.code?.trim() || null,
            })
            toast.success("Mata pelajaran berhasil ditambahkan")
            setAddOpen(false)
            setAddForm(EMPTY_FORM)
            fetchSubjects()
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            toast.error(msg || "Gagal menambahkan mata pelajaran")
        } finally {
            setIsAdding(false)
        }
    }

    const openEdit = (subject: Subject) => {
        setEditTarget(subject)
        setEditForm({ name: subject.name, code: subject.code ?? "" })
    }

    const handleEdit = async () => {
        if (!editTarget) return
        if (!editForm.name.trim()) {
            toast.error("Nama mata pelajaran wajib diisi")
            return
        }
        setIsEditing(true)
        try {
            await api.put(`/subjects/${editTarget.public_id}`, {
                name: editForm.name.trim(),
                code: editForm.code?.trim() || null,
            })
            toast.success("Mata pelajaran berhasil diperbarui")
            setEditTarget(null)
            fetchSubjects()
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            toast.error(msg || "Gagal memperbarui mata pelajaran")
        } finally {
            setIsEditing(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setIsDeleting(true)
        try {
            await api.delete(`/subjects/${deleteTarget.public_id}`)
            toast.success("Mata pelajaran berhasil dihapus")
            setDeleteTarget(null)
            fetchSubjects()
        } catch {
            toast.error("Gagal menghapus mata pelajaran")
        } finally {
            setIsDeleting(false)
        }
    }

    // ── Filter ────────────────────────────────────────────────────────────────

    const filtered = subjects.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.code ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    )

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <BookOpen className="h-6 w-6" />
                        Manajemen Mata Pelajaran
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Kelola daftar mata pelajaran yang diajarkan di sekolah Anda.
                    </p>
                </div>
                <Button className="gap-2 shrink-0" onClick={() => { setAddForm(EMPTY_FORM); setAddOpen(true) }}>
                    <Plus className="h-4 w-4" /> Tambah Mata Pelajaran
                </Button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                    placeholder="Cari nama atau kode..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="h-9"
                />
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Mata Pelajaran</TableHead>
                            <TableHead className="w-32">Kode</TableHead>
                            <TableHead className="text-right w-36">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                                    Memuat data mata pelajaran...
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <BookOpen className="h-8 w-8 opacity-30" />
                                        <p>
                                            {searchQuery
                                                ? "Tidak ada mata pelajaran yang sesuai."
                                                : "Belum ada mata pelajaran. Klik \"Tambah Mata Pelajaran\" untuk memulai."}
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map(subject => (
                                <TableRow key={subject.public_id}>
                                    <TableCell className="font-medium">{subject.name}</TableCell>
                                    <TableCell className="text-muted-foreground font-mono text-sm">
                                        {subject.code || <span className="italic opacity-50">—</span>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1"
                                                onClick={() => openEdit(subject)}
                                            >
                                                <Pencil className="h-3.5 w-3.5" /> Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1 text-destructive hover:text-destructive"
                                                onClick={() => setDeleteTarget(subject)}
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

            {/* ── Add Dialog ───────────────────────────────────────────────────── */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah Mata Pelajaran</DialogTitle>
                        <DialogDescription>
                            Isi nama mata pelajaran dan kode singkat (opsional).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="add-name">Nama Mata Pelajaran <span className="text-destructive">*</span></Label>
                            <Input
                                id="add-name"
                                placeholder="Contoh: Matematika"
                                value={addForm.name}
                                onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                                onKeyDown={e => e.key === "Enter" && handleAdd()}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="add-code">Kode <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                            <Input
                                id="add-code"
                                placeholder="Contoh: MTK"
                                value={addForm.code ?? ""}
                                onChange={e => setAddForm(f => ({ ...f, code: e.target.value }))}
                                onKeyDown={e => e.key === "Enter" && handleAdd()}
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

            {/* ── Edit Dialog ──────────────────────────────────────────────────── */}
            <Dialog open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Mata Pelajaran</DialogTitle>
                        <DialogDescription>Perbarui nama atau kode mata pelajaran.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Nama Mata Pelajaran <span className="text-destructive">*</span></Label>
                            <Input
                                id="edit-name"
                                value={editForm.name}
                                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                onKeyDown={e => e.key === "Enter" && handleEdit()}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-code">Kode <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                            <Input
                                id="edit-code"
                                value={editForm.code ?? ""}
                                onChange={e => setEditForm(f => ({ ...f, code: e.target.value }))}
                                onKeyDown={e => e.key === "Enter" && handleEdit()}
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

            {/* ── Delete Alert ─────────────────────────────────────────────────── */}
            <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Mata Pelajaran?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda akan menghapus <strong>{deleteTarget?.name}</strong>. Tindakan ini tidak bisa dibatalkan.
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
        </div>
    )
}
