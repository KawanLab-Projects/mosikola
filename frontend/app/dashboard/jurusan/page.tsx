"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { api } from "@/lib/api"
import { StudyProgram, StudyProgramInput } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function JurusanPage() {
    const [jurusans, setJurusans] = useState<StudyProgram[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedJurusan, setSelectedJurusan] = useState<StudyProgram | null>(null)

    // Form state
    const [formData, setFormData] = useState<StudyProgramInput>({
        name: "",
        short: "",
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const fetchJurusans = async () => {
        setIsLoading(true)
        try {
            const response = await api.get('/study-programs')
            // Handle different response structures (e.g., if wrapped in 'data')
            const data = response.data.data || response.data
            setJurusans(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Error fetching jurusans:", error)
            toast.error("Gagal memuat data jurusan")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchJurusans()
    }, [])

    const handleOpenDialog = (jurusan?: StudyProgram) => {
        if (jurusan) {
            setSelectedJurusan(jurusan)
            setFormData({
                name: jurusan.name,
                short: jurusan.short,
            })
        } else {
            setSelectedJurusan(null)
            setFormData({
                name: "",
                short: "",
            })
        }
        setIsDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            if (selectedJurusan) {
                await api.put(`/study-programs/${selectedJurusan.public_id}`, formData)
                toast.success("Jurusan berhasil diperbarui")
            } else {
                await api.post('/study-programs', formData)
                toast.success("Jurusan berhasil ditambahkan")
            }
            setIsDialogOpen(false)
            fetchJurusans()
        } catch (error) {
            console.error("Error saving jurusan:", error)
            toast.error("Gagal menyimpan jurusan")
        } finally {
            setIsSubmitting(false)
        }
    }

    const confirmDelete = (jurusan: StudyProgram) => {
        setSelectedJurusan(jurusan)
        setIsDeleteDialogOpen(true)
    }

    const handleDelete = async () => {
        if (!selectedJurusan) return

        try {
            await api.delete(`/study-programs/${selectedJurusan.public_id}`)
            toast.success("Jurusan berhasil dihapus")
            setIsDeleteDialogOpen(false)
            fetchJurusans()
        } catch (error) {
            console.error("Error deleting jurusan:", error)
            toast.error("Gagal menghapus jurusan")
        }
    }

    const filteredJurusans = jurusans.filter(j =>
        j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.short.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Manajemen Jurusan</h1>
                    <p className="text-muted-foreground">
                        Kelola daftar jurusan dan kode jurusan.
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Jurusan
                </Button>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Cari jurusan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9"
                />
            </div>

            <div className="border rounded-md bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-base">Nama Jurusan</TableHead>
                            <TableHead className="text-base">Kode</TableHead>
                            <TableHead className="w-[100px] text-right text-base">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    Memuat data...
                                </TableCell>
                            </TableRow>
                        ) : filteredJurusans.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    Tidak ada data jurusan.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredJurusans.map((jurusan) => (
                                <TableRow key={jurusan.public_id}>
                                    <TableCell className="font-medium">{jurusan.name}</TableCell>
                                    <TableCell>{jurusan.short}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenDialog(jurusan)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => confirmDelete(jurusan)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {selectedJurusan ? "Edit Jurusan" : "Tambah Jurusan Baru"}
                        </DialogTitle>
                        <DialogDescription>
                            Isi informasi jurusan di bawah ini. Klik simpan untuk melakukan perubahan.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nama_jurusan">Nama Jurusan</Label>
                            <Input
                                id="nama_jurusan"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Contoh: Rekayasa Perangkat Lunak"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="kode_jurusan">Kode Jurusan</Label>
                            <Input
                                id="kode_jurusan"
                                value={formData.short}
                                onChange={(e) => setFormData({ ...formData, short: e.target.value })}
                                placeholder="Contoh: RPL"
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Menyimpan..." : "Simpan"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Apakah anda yakin?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data jurusan
                            <span className="font-semibold"> {selectedJurusan?.name} </span>
                            dari sistem.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}