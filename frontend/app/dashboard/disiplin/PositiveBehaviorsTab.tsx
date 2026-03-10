"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Loader2, Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
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
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface PositiveBehavior {
    id: number
    name: string
    point_value: number
}

export default function PositiveBehaviorsTab() {
    const queryClient = useQueryClient()
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<PositiveBehavior | null>(null)
    const [formData, setFormData] = useState({ name: "", point_value: 0 })

    const { data, isLoading } = useQuery({
        queryKey: ["positive-behaviors"],
        queryFn: async () => {
            const res = await api.get("/positive-behaviors")
            return res.data.data
        }
    })

    const createMutation = useMutation({
        mutationFn: async (payload: { name: string; point_value: number }) => {
            return await api.post("/positive-behaviors", payload)
        },
        onSuccess: () => {
            toast.success("Kegiatan Positif ditambahkan")
            queryClient.invalidateQueries({ queryKey: ["positive-behaviors"] })
            setIsAddOpen(false)
            setFormData({ name: "", point_value: 0 })
        },
        onError: () => toast.error("Gagal menambahkan")
    })

    const updateMutation = useMutation({
        mutationFn: async (payload: { name: string; point_value: number }) => {
            return await api.put(`/positive-behaviors/${selectedItem?.id}`, payload)
        },
        onSuccess: () => {
            toast.success("Kegiatan Positif diperbarui")
            queryClient.invalidateQueries({ queryKey: ["positive-behaviors"] })
            setIsEditOpen(false)
            setSelectedItem(null)
        },
        onError: () => toast.error("Gagal memperbarui")
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            return await api.delete(`/positive-behaviors/${id}`)
        },
        onSuccess: () => {
            toast.success("Kegiatan Positif dihapus")
            queryClient.invalidateQueries({ queryKey: ["positive-behaviors"] })
            setIsDeleteOpen(false)
            setSelectedItem(null)
        },
        onError: (e: unknown) => {
            const err = e as { response?: { data?: { message?: string } } }
            const msg = err?.response?.data?.message || "Gagal menghapus"
            toast.error(msg)
        }
    })

    const handleOpenEdit = (item: PositiveBehavior) => {
        setSelectedItem(item)
        setFormData({ name: item.name, point_value: item.point_value })
        setIsEditOpen(true)
    }

    const handleOpenDelete = (item: PositiveBehavior) => {
        setSelectedItem(item)
        setIsDeleteOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Input placeholder="Cari kegiatan positif..." className="max-w-sm" />
                <Button onClick={() => setIsAddOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Kegiatan Positif
                </Button>
            </div>

            <div className="rounded-md border bg-white dark:bg-slate-950">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">No</TableHead>
                            <TableHead>Nama Kegiatan Positif</TableHead>
                            <TableHead className="text-center">Poin Reward</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <Loader2 className="h-8 w-8 animate-spin mb-4" />
                                        <p>Memuat data pelanggaraan...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                                    Belum ada data jenis pelanggaran
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.map((item: PositiveBehavior, idx: number) => (
                                <TableRow key={item.id}>
                                    <TableCell>{idx + 1}</TableCell>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="text-center font-semibold text-green-600">{item.point_value}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="outline" size="icon" onClick={() => handleOpenEdit(item)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleOpenDelete(item)}>
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

            {/* Create Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah Kegiatan Positif</DialogTitle>
                        <DialogDescription>Masukkan nama kegiatan positif dan poin yang diberikan.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Nama</Label>
                            <Input id="name" className="col-span-3" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Cth: Membantu Teman yang Kesulitan" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="points" className="text-right">Poin</Label>
                            <Input id="points" type="number" className="col-span-3" value={formData.point_value} onChange={(e) => setFormData({ ...formData, point_value: parseInt(e.target.value) || 0 })} min={0} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Batal</Button>
                        <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending || !formData.name}>
                            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Kegiatan Positif</DialogTitle>
                        <DialogDescription>Perbarui nama kegiatan positif atau poin reward.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">Nama</Label>
                            <Input id="edit-name" className="col-span-3" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-points" className="text-right">Poin</Label>
                            <Input id="edit-points" type="number" className="col-span-3" value={formData.point_value} onChange={(e) => setFormData({ ...formData, point_value: parseInt(e.target.value) || 0 })} min={0} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
                        <Button onClick={() => updateMutation.mutate(formData)} disabled={updateMutation.isPending || !formData.name}>
                            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Perubahan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Kegiatan Positif</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus <strong>{selectedItem?.name}</strong>? Tindakan ini tidak dapat diurungkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
                        <Button variant="destructive" onClick={() => deleteMutation.mutate(selectedItem!.id)} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
