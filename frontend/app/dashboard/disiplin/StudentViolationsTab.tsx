"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { format } from "date-fns"
import { Loader2, Plus, Trash2, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface Classroom {
    id: number
    public_id: string
    name: string
}

interface Student {
    id: number
    public_id: string
    name: string
    nisn: string
}

interface Violation {
    id: number
    name: string
    points: number
}

interface StudentViolationRecord {
    id: number
    date: string
    notes: string | null
    student?: Student
    violation?: Violation
    recorded_by?: { name: string }
}

export default function StudentViolationsTab() {
    const queryClient = useQueryClient()
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<StudentViolationRecord | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    const [formData, setFormData] = useState({
        classroomId: "",
        student_id: "",
        violation_id: "",
        date: new Date(),
        notes: ""
    })

    // Queries
    const { data: records, isLoading: recordsLoading } = useQuery({
        queryKey: ["student-violations"],
        queryFn: async () => {
            const res = await api.get("/student-violations")
            return res.data.data
        }
    })

    const { data: violations } = useQuery({
        queryKey: ["violations"],
        queryFn: async () => {
            const res = await api.get("/violations")
            return res.data.data
        }
    })

    const { data: classrooms } = useQuery({
        queryKey: ["classrooms-list"],
        queryFn: async () => {
            const res = await api.get("/classrooms")
            return res.data.data
        }
    })

    const { data: students, isLoading: studentsLoading } = useQuery({
        queryKey: ["classroom-students", formData.classroomId],
        queryFn: async () => {
            if (!formData.classroomId) return []
            const res = await api.get(`/classrooms/${formData.classroomId}/students`)
            return res.data.data
        },
        enabled: !!formData.classroomId
    })

    // Mutations
    const createMutation = useMutation({
        mutationFn: async (payload: { student_id: string; violation_id: string; date: string; notes: string }) => {
            return await api.post("/student-violations", payload)
        },
        onSuccess: () => {
            toast.success("Catatan pelanggaran ditambahkan")
            queryClient.invalidateQueries({ queryKey: ["student-violations"] })
            setIsAddOpen(false)
            setFormData({ classroomId: "", student_id: "", violation_id: "", date: new Date(), notes: "" })
        },
        onError: (e: unknown) => {
            const err = e as { response?: { data?: { message?: string } } }
            toast.error(err?.response?.data?.message || "Gagal menambahkan catatan")
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            return await api.delete(`/student-violations/${id}`)
        },
        onSuccess: () => {
            toast.success("Catatan pelanggaran dihapus")
            queryClient.invalidateQueries({ queryKey: ["student-violations"] })
            setIsDeleteOpen(false)
            setSelectedItem(null)
        },
        onError: () => toast.error("Gagal menghapus catatan")
    })

    const handleCreate = () => {
        if (!formData.student_id || !formData.violation_id || !formData.date) {
            toast.error("Mohon lengkapi semua data wajib")
            return
        }

        createMutation.mutate({
            student_id: formData.student_id,
            violation_id: formData.violation_id,
            date: format(formData.date, "yyyy-MM-dd"),
            notes: formData.notes
        })
    }

    const filteredRecords = records?.filter((item: StudentViolationRecord) =>
        (item.student?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (item.violation?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Input
                    placeholder="Cari nama siswa atau pelanggaran..."
                    className="max-w-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button onClick={() => setIsAddOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Catat Pelanggaran
                </Button>
            </div>

            <div className="rounded-md border bg-white dark:bg-slate-950">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">No</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Nama Siswa</TableHead>
                            <TableHead>Jenis Pelanggaran</TableHead>
                            <TableHead className="text-center">Poin</TableHead>
                            <TableHead>Pencatat</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recordsLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <Loader2 className="h-8 w-8 animate-spin mb-4" />
                                        <p>Memuat riwayat pelanggaran...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredRecords?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                                    Belum ada catatan pelanggaran yang ditemukan.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRecords?.map((item: StudentViolationRecord, idx: number) => (
                                <TableRow key={item.id}>
                                    <TableCell>{idx + 1}</TableCell>
                                    <TableCell>{format(new Date(item.date), "dd MMM yyyy")}</TableCell>
                                    <TableCell>
                                        <div className="font-medium text-slate-800 dark:text-slate-200">{item.student?.name}</div>
                                        <div className="text-xs text-slate-500">{item.student?.nisn}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-semibold">{item.violation?.name}</div>
                                        {item.notes && <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.notes}</div>}
                                    </TableCell>
                                    <TableCell className="text-center font-bold text-red-600">+{item.violation?.points}</TableCell>
                                    <TableCell className="text-sm">{item.recorded_by?.name || 'Sistem'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => { setSelectedItem(item); setIsDeleteOpen(true); }}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Catat Pelanggaran Siswa</DialogTitle>
                        <DialogDescription>Masukkan detail pelanggaran siswa dengan memilih kelas, data siswa, dan pelanggaran.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Tanggal</Label>
                            <div className="col-span-3">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {format(formData.date, "dd MMMM yyyy")}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={formData.date}
                                            onSelect={(day) => day && setFormData({ ...formData, date: day })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Kelas</Label>
                            <Select value={formData.classroomId} onValueChange={(val) => setFormData({ ...formData, classroomId: val, student_id: "" })}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Pilih Kelas" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classrooms?.map((c: Classroom) => (
                                        <SelectItem key={c.id} value={c.public_id || c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Siswa</Label>
                            <Select value={formData.student_id} onValueChange={(val) => setFormData({ ...formData, student_id: val })} disabled={!formData.classroomId || studentsLoading}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder={studentsLoading ? "Memuat..." : "Pilih Siswa"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {students?.map((s: Student, idx: number) => {
                                        const keyId = s.public_id || s.id || `student-${idx}`;
                                        return (
                                            <SelectItem key={keyId} value={String(s.public_id || s.id)}>{s.name}</SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Pelanggaran</Label>
                            <Select value={formData.violation_id} onValueChange={(val) => setFormData({ ...formData, violation_id: val })}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Pilih Jenis" />
                                </SelectTrigger>
                                <SelectContent>
                                    {violations?.map((v: Violation) => (
                                        <SelectItem key={v.id} value={v.id.toString()}>{v.name} ({v.points} Poin)</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Catatan</Label>
                            <Input className="col-span-3" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Catatan opsional..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Batal</Button>
                        <Button onClick={handleCreate} disabled={createMutation.isPending || !formData.student_id || !formData.violation_id}>
                            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Catatan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Catatan</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus catatan pelanggaran <strong>{selectedItem?.student?.name}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
                        <Button variant="destructive" onClick={() => selectedItem && deleteMutation.mutate(selectedItem.id)} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
