"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Search, X } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function JurusanPage() {
    const [jurusans, setJurusans] = useState<StudyProgram[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedJurusan, setSelectedJurusan] = useState<StudyProgram | null>(null)

    // Form state
    const [addMode, setAddMode] = useState<"single" | "bulk">("single")
    const [formData, setFormData] = useState<StudyProgramInput>({
        name: "",
        short: "",
    })
    const [bulkData, setBulkData] = useState<StudyProgramInput[]>([
        { name: "", short: "" }
    ])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const fetchJurusans = async () => {
        setIsLoading(true)
        try {
            const response = await api.get('/study-programs')
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
            setAddMode("single")
        } else {
            setSelectedJurusan(null)
            setFormData({
                name: "",
                short: "",
            })
            setBulkData([{ name: "", short: "" }])
            setAddMode("single")
        }
        setIsDialogOpen(true)
    }

    const handleAddBulkRow = () => {
        setBulkData([...bulkData, { name: "", short: "" }])
    }

    const handleRemoveBulkRow = (index: number) => {
        if (bulkData.length > 1) {
            const newBulkData = [...bulkData]
            newBulkData.splice(index, 1)
            setBulkData(newBulkData)
        }
    }

    const handleBulkChange = (index: number, field: keyof StudyProgramInput, value: string) => {
        const newBulkData = [...bulkData]
        newBulkData[index][field] = value
        setBulkData(newBulkData)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            if (selectedJurusan) {
                await api.put(`/study-programs/${selectedJurusan.public_id}`, formData)
                toast.success("Jurusan berhasil diperbarui")
            } else {
                if (addMode === "single") {
                    await api.post('/study-programs', formData)
                } else {
                    // Filter out empty rows
                    const items = bulkData.filter(item => item.name.trim() !== "" || item.short.trim() !== "")
                    if (items.length === 0) {
                        toast.error("Mohon isi setidaknya satu data jurusan")
                        setIsSubmitting(false)
                        return
                    }
                    await api.post('/study-programs/bulk', { items })
                }
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
                <DialogContent className={addMode === "bulk" && !selectedJurusan ? "max-w-2xl" : "max-w-md"}>
                    <DialogHeader>
                        <DialogTitle>
                            {selectedJurusan ? "Edit Jurusan" : "Tambah Jurusan Baru"}
                        </DialogTitle>
                        <DialogDescription>
                            Isi informasi jurusan di bawah ini. Klik simpan untuk melakukan perubahan.
                        </DialogDescription>
                    </DialogHeader>

                    {!selectedJurusan ? (
                        <Tabs defaultValue="single" value={addMode} onValueChange={(v) => setAddMode(v as any)} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="single">Single</TabsTrigger>
                                <TabsTrigger value="bulk">Tambah Banyak</TabsTrigger>
                            </TabsList>
                            <form onSubmit={handleSubmit} className="mt-4">
                                <TabsContent value="single" className="space-y-4 py-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Nama Jurusan</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Contoh: Rekayasa Perangkat Lunak"
                                            required={addMode === "single"}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="short">Kode Jurusan</Label>
                                        <Input
                                            id="short"
                                            value={formData.short}
                                            onChange={(e) => setFormData({ ...formData, short: e.target.value })}
                                            placeholder="Contoh: RPL"
                                            required={addMode === "single"}
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="bulk" className="space-y-4">
                                    <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
                                        {bulkData.map((item, index) => (
                                            <div key={index} className="flex gap-3 items-end border p-3 rounded-lg bg-slate-50 relative">
                                                <div className="grid gap-2 flex-1">
                                                    <Label>Nama Jurusan</Label>
                                                    <Input
                                                        value={item.name}
                                                        onChange={(e) => handleBulkChange(index, "name", e.target.value)}
                                                        placeholder="Nama"
                                                    />
                                                </div>
                                                <div className="grid gap-2 w-24">
                                                    <Label>Kode</Label>
                                                    <Input
                                                        value={item.short}
                                                        onChange={(e) => handleBulkChange(index, "short", e.target.value)}
                                                        placeholder="Kode"
                                                    />
                                                </div>
                                                {bulkData.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 h-9 w-9"
                                                        onClick={() => handleRemoveBulkRow(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full border-dashed"
                                        onClick={handleAddBulkRow}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Tambah Baris
                                    </Button>
                                </TabsContent>

                                <DialogFooter className="mt-6">
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Batal
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? "Menyimpan..." : "Simpan"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Tabs>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit_name">Nama Jurusan</Label>
                                <Input
                                    id="edit_name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit_short">Kode Jurusan</Label>
                                <Input
                                    id="edit_short"
                                    value={formData.short}
                                    onChange={(e) => setFormData({ ...formData, short: e.target.value })}
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
                    )}
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