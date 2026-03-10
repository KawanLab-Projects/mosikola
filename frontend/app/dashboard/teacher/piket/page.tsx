"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Loader2, Plus, Trash2, Calendar as CalendarIcon, ShieldAlert, Star } from "lucide-react"
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
import { InputSearch } from "@/components/ui/input-search"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Student {
    id: number;
    public_id: string;
    name: string;
    nisn?: string;
}

interface Violation {
    id: number;
    name: string;
    points: number;
}

interface PositiveBehavior {
    id: number;
    name: string;
    point_value: number;
}

interface ViolationRecord {
    id: number;
    date: string;
    recorded_by_user_id: number;
    student?: Student;
    violation?: Violation;
    recorded_by?: {
        name: string;
    };
    notes?: string;
}

interface PositiveBehaviorRecord {
    id: number;
    date: string;
    recorded_by_user_id: number;
    student?: Student;
    positive_behavior?: PositiveBehavior;
    recorded_by?: {
        name: string;
    };
    notes?: string;
}

interface UserAuth {
    id: number;
    name: string;
    role: string;
}

interface CreateViolationPayload {
    student_ids: string[];
    violation_id: string;
    date: string;
    notes: string;
}

interface CreatePositiveBehaviorPayload {
    student_ids: string[];
    positive_behavior_id: string;
    date: string;
    notes: string;
}


export default function PiketPage() {
    const queryClient = useQueryClient()

    // Violation State
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<ViolationRecord | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [formData, setFormData] = useState({ student_ids: [] as string[], violation_id: "", date: new Date(), notes: "" })

    // Positive Behavior State
    const [isPosAddOpen, setIsPosAddOpen] = useState(false)
    const [isPosDeleteOpen, setIsPosDeleteOpen] = useState(false)
    const [selectedPosItem, setSelectedPosItem] = useState<PositiveBehaviorRecord | null>(null)
    const [posSearchQuery, setPosSearchQuery] = useState("")
    const [posFormData, setPosFormData] = useState({ student_ids: [] as string[], positive_behavior_id: "", date: new Date(), notes: "" })

    // Get current logged in teacher
    const { data: user } = useQuery<UserAuth>({
        queryKey: ["auth-me-piket"],
        queryFn: async () => (await api.get("/auth/me")).data.user
    })

    const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
        queryKey: ["all-students-piket"],
        queryFn: async () => (await api.get(`/students`)).data?.data || []
    })

    // --- Violations Queries & Mutations ---
    const { data: records, isLoading: recordsLoading } = useQuery<ViolationRecord[]>({
        queryKey: ["student-violations-piket"],
        queryFn: async () => (await api.get("/student-violations")).data.data
    })
    const { data: violations } = useQuery<Violation[]>({
        queryKey: ["violations-list"],
        queryFn: async () => (await api.get("/violations")).data.data
    })
    const createMutation = useMutation({
        mutationFn: async (payload: CreateViolationPayload) => await api.post("/student-violations/bulk", payload),
        onSuccess: (res: { data: { message?: string } }) => {
            toast.success(res?.data?.message || "Catatan pelanggaran berhasil ditambahkan")
            queryClient.invalidateQueries({ queryKey: ["student-violations-piket"] })
            setIsAddOpen(false)
            setFormData({ student_ids: [], violation_id: "", date: new Date(), notes: "" })
        },
        onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e?.response?.data?.message || "Gagal menambahkan catatan")
    })
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => await api.delete(`/student-violations/${id}`),
        onSuccess: () => {
            toast.success("Catatan pelanggaran berhasil dihapus")
            queryClient.invalidateQueries({ queryKey: ["student-violations-piket"] })
            setIsDeleteOpen(false)
            setSelectedItem(null)
        },
        onError: () => toast.error("Gagal menghapus catatan")
    })

    // --- Positive Behaviors Queries & Mutations ---
    const { data: posRecords, isLoading: posRecordsLoading } = useQuery<PositiveBehaviorRecord[]>({
        queryKey: ["student-positive-behaviors-piket"],
        queryFn: async () => (await api.get("/student-positive-behaviors")).data.data
    })
    const { data: positiveBehaviors } = useQuery<PositiveBehavior[]>({
        queryKey: ["positive-behaviors-list"],
        queryFn: async () => (await api.get("/positive-behaviors")).data.data
    })
    const posCreateMutation = useMutation({
        mutationFn: async (payload: CreatePositiveBehaviorPayload) => await api.post("/student-positive-behaviors/bulk", payload),
        onSuccess: (res: { data: { message?: string } }) => {
            toast.success(res?.data?.message || "Catatan perilaku positif berhasil ditambahkan")
            queryClient.invalidateQueries({ queryKey: ["student-positive-behaviors-piket"] })
            setIsPosAddOpen(false)
            setPosFormData({ student_ids: [], positive_behavior_id: "", date: new Date(), notes: "" })
        },
        onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e?.response?.data?.message || "Gagal menambahkan catatan")
    })
    const posDeleteMutation = useMutation({
        mutationFn: async (id: number) => await api.delete(`/student-positive-behaviors/${id}`),
        onSuccess: () => {
            toast.success("Catatan perilaku positif berhasil dihapus")
            queryClient.invalidateQueries({ queryKey: ["student-positive-behaviors-piket"] })
            setIsPosDeleteOpen(false)
            setSelectedPosItem(null)
        },
        onError: () => toast.error("Gagal menghapus catatan")
    })

    // --- Handlers ---
    const handleCreate = () => {
        if (formData.student_ids.length === 0 || !formData.violation_id || !formData.date) return toast.error("Mohon lengkapi semua data wajib")
        createMutation.mutate({ student_ids: formData.student_ids, violation_id: formData.violation_id, date: format(formData.date, "yyyy-MM-dd"), notes: formData.notes })
    }
    const handlePosCreate = () => {
        if (posFormData.student_ids.length === 0 || !posFormData.positive_behavior_id || !posFormData.date) return toast.error("Mohon lengkapi semua data wajib")
        posCreateMutation.mutate({ student_ids: posFormData.student_ids, positive_behavior_id: posFormData.positive_behavior_id, date: format(posFormData.date, "yyyy-MM-dd"), notes: posFormData.notes })
    }

    const filteredRecords = records?.filter((item: ViolationRecord) =>
        item.student?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.violation?.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    const posFilteredRecords = posRecords?.filter((item: PositiveBehaviorRecord) =>
        item.student?.name.toLowerCase().includes(posSearchQuery.toLowerCase()) ||
        item.positive_behavior?.name.toLowerCase().includes(posSearchQuery.toLowerCase())
    )

    return (
        <div className="flex-1 space-y-6 p-8">
            <div className="flex flex-col space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Guru Piket</h2>
                <p className="text-muted-foreground">Catat dan pantau pelanggaran serta perilaku positif siswa di sekolah.</p>
            </div>

            <Tabs defaultValue="pelanggaran" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="pelanggaran" className="gap-2"><ShieldAlert className="h-4 w-4" /> Pelanggaran</TabsTrigger>
                    <TabsTrigger value="positif" className="gap-2"><Star className="h-4 w-4" /> Perilaku Positif</TabsTrigger>
                </TabsList>

                <TabsContent value="pelanggaran" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-red-600" /> Catatan Pelanggaran Siswa</CardTitle>
                                <CardDescription>Daftar seluruh pelanggaran kedisiplinan siswa yang telah dicatat. Poin akan ditambahkan ke akumulasi siswa.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Input placeholder="Cari nama siswa atau jenis pelanggaran..." className="max-w-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                <Button onClick={() => setIsAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Catat Pelanggaran</Button>
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
                                            <TableRow><TableCell colSpan={7} className="h-48 text-center"><Loader2 className="h-8 w-8 animate-spin mb-4 mx-auto text-muted-foreground" /><p className="text-muted-foreground">Memuat riwayat pelanggaran...</p></TableCell></TableRow>
                                        ) : filteredRecords?.length === 0 ? (
                                            <TableRow><TableCell colSpan={7} className="h-48 text-center text-muted-foreground">Belum ada catatan pelanggaran yang ditemukan.</TableCell></TableRow>
                                        ) : (
                                            filteredRecords?.map((item: ViolationRecord, idx: number) => {
                                                const canDelete = user?.id === item.recorded_by_user_id || user?.role === 'admin'
                                                return (
                                                    <TableRow key={item.id}>
                                                        <TableCell>{idx + 1}</TableCell>
                                                        <TableCell>{format(new Date(item.date), "dd MMM yyyy", { locale: id })}</TableCell>
                                                        <TableCell>
                                                            <div className="font-medium">{item.student?.name}</div>
                                                            <div className="text-xs text-muted-foreground">{item.student?.nisn}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="font-semibold">{item.violation?.name}</div>
                                                            {item.notes && <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.notes}</div>}
                                                        </TableCell>
                                                        <TableCell className="text-center font-bold text-red-600">+{item.violation?.points}</TableCell>
                                                        <TableCell className="text-sm">{item.recorded_by?.name || 'Sistem'}</TableCell>
                                                        <TableCell className="text-right">
                                                            {canDelete && <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => { setSelectedItem(item); setIsDeleteOpen(true); }}><Trash2 className="h-4 w-4" /></Button>}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="positif" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-emerald-600" /> Catatan Perilaku Positif Siswa</CardTitle>
                                <CardDescription>Daftar perilaku baik yang dicatat. Poin ini akan mengurangi total poin pelanggaran siswa (Sistem Reduction).</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Input placeholder="Cari nama siswa atau perilaku..." className="max-w-sm" value={posSearchQuery} onChange={(e) => setPosSearchQuery(e.target.value)} />
                                <Button onClick={() => setIsPosAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="mr-2 h-4 w-4" /> Catat Perilaku Positif</Button>
                            </div>
                            <div className="rounded-md border bg-white dark:bg-slate-950">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">No</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>Nama Siswa</TableHead>
                                            <TableHead>Perilaku Positif</TableHead>
                                            <TableHead className="text-center">Pengurangan Poin</TableHead>
                                            <TableHead>Pencatat</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {posRecordsLoading ? (
                                            <TableRow><TableCell colSpan={7} className="h-48 text-center"><Loader2 className="h-8 w-8 animate-spin mb-4 mx-auto text-muted-foreground" /><p className="text-muted-foreground">Memuat riwayat...</p></TableCell></TableRow>
                                        ) : posFilteredRecords?.length === 0 ? (
                                            <TableRow><TableCell colSpan={7} className="h-48 text-center text-muted-foreground">Belum ada catatan perilaku positif yang ditemukan.</TableCell></TableRow>
                                        ) : (
                                            posFilteredRecords?.map((item: PositiveBehaviorRecord, idx: number) => {
                                                const canDelete = user?.id === item.recorded_by_user_id || user?.role === 'admin'
                                                return (
                                                    <TableRow key={item.id}>
                                                        <TableCell>{idx + 1}</TableCell>
                                                        <TableCell>{format(new Date(item.date), "dd MMM yyyy", { locale: id })}</TableCell>
                                                        <TableCell>
                                                            <div className="font-medium">{item.student?.name}</div>
                                                            <div className="text-xs text-muted-foreground">{item.student?.nisn}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="font-semibold text-emerald-700 dark:text-emerald-400">{item.positive_behavior?.name}</div>
                                                            {item.notes && <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.notes}</div>}
                                                        </TableCell>
                                                        <TableCell className="text-center font-bold text-emerald-600">-{item.positive_behavior?.point_value}</TableCell>
                                                        <TableCell className="text-sm">{item.recorded_by?.name || 'Sistem'}</TableCell>
                                                        <TableCell className="text-right">
                                                            {canDelete && <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => { setSelectedPosItem(item); setIsPosDeleteOpen(true); }}><Trash2 className="h-4 w-4" /></Button>}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Violation Dialogs */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader><DialogTitle>Catat Pelanggaran</DialogTitle><DialogDescription>Pilih siswa dan jenis pelanggaran yang dilakukan.</DialogDescription></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right text-sm">Tanggal</Label><div className="col-span-3"><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{format(formData.date, "dd MMMM yyyy", { locale: id })}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.date} onSelect={(d) => d && setFormData({ ...formData, date: d })} initialFocus /></PopoverContent></Popover></div></div>
                        <div className="grid grid-cols-4 items-start gap-4"><Label className="text-right text-sm mt-3">Siswa</Label><div className="col-span-3 space-y-2">{formData.student_ids.length > 0 && (<div className="flex flex-wrap gap-2">{formData.student_ids.map((idVal) => { const s = students?.find((st: Student) => String(st.public_id || st.id) === idVal); return (<div key={idVal} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">{s ? s.name : idVal} <button type="button" onClick={() => setFormData(prev => ({ ...prev, student_ids: prev.student_ids.filter(i => i !== idVal) }))} className="hover:text-destructive ml-1"><Trash2 className="h-3 w-3" /></button></div>) })}</div>)}<InputSearch placeholder={studentsLoading ? "Memuat..." : "Ketik nama/nisn mencari siswa"} data={students || []} isLoading={studentsLoading} clearOnSelect onSearch={(t) => { if (!students) return []; const lt = t.toLowerCase(); return students.filter((s: Student) => s.name.toLowerCase().includes(lt) || s.nisn?.toLowerCase().includes(lt)) }} keyExtractor={(s: Student) => String(s.public_id || s.id)} renderItem={(s: Student) => <span>{s.name} <span className="text-muted-foreground text-xs ml-2">({s.nisn})</span></span>} onSelect={(s: Student) => { const sId = String(s.public_id || s.id); if (!formData.student_ids.includes(sId)) setFormData(p => ({ ...p, student_ids: [...p.student_ids, sId] })) }} /></div></div>
                        <div className="grid grid-cols-4 items-start gap-4"><Label className="text-right text-sm mt-3">Pelanggaran</Label><div className="col-span-3 space-y-2">{formData.violation_id && (<div className="flex items-center gap-1 bg-red-100 text-red-800 px-3 py-2 rounded-md border border-red-200"><span className="font-medium text-sm">{violations?.find((v: Violation) => String(v.id) === formData.violation_id)?.name}</span><button type="button" onClick={() => setFormData(prev => ({ ...prev, violation_id: "" }))} className="hover:bg-red-200 p-1 rounded-full ml-auto"><Trash2 className="h-3.5 w-3.5" /></button></div>)}{!formData.violation_id && (<InputSearch placeholder="Cetak jenis pelanggaran..." data={violations || []} clearOnSelect onSearch={(t) => { if (!violations) return []; const lt = t.toLowerCase(); return violations.filter((v: Violation) => v.name.toLowerCase().includes(lt)) }} keyExtractor={(v: Violation) => String(v.id)} renderItem={(v: Violation) => <div className="w-full flex justify-between"><span>{v.name}</span><span className="text-red-600 font-bold text-xs">+{v.points} Poin</span></div>} onSelect={(v: Violation) => setFormData(p => ({ ...p, violation_id: String(v.id) }))} />)}</div></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right text-sm">Catatan</Label><Input className="col-span-3" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Opsional..." /></div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setIsAddOpen(false)}>Batal</Button><Button onClick={handleCreate} disabled={createMutation.isPending || formData.student_ids.length === 0 || !formData.violation_id}>{createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan</Button></DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}><DialogContent><DialogHeader><DialogTitle>Hapus Catatan</DialogTitle><DialogDescription>Yakin hapus pelanggaran <strong>{selectedItem?.violation?.name}</strong> untuk <strong>{selectedItem?.student?.name}</strong>?</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Batal</Button><Button variant="destructive" onClick={() => deleteMutation.mutate(selectedItem?.id || 0)} disabled={deleteMutation.isPending}>{deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Hapus</Button></DialogFooter></DialogContent></Dialog>

            {/* Positive Behavior Dialogs */}
            <Dialog open={isPosAddOpen} onOpenChange={setIsPosAddOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader><DialogTitle>Catat Perilaku Positif</DialogTitle><DialogDescription>Berikan apresiasi pada siswa atas tindakan baiknya.</DialogDescription></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right text-sm">Tanggal</Label><div className="col-span-3"><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{format(posFormData.date, "dd MMMM yyyy", { locale: id })}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={posFormData.date} onSelect={(d) => d && setPosFormData({ ...posFormData, date: d })} initialFocus /></PopoverContent></Popover></div></div>
                        <div className="grid grid-cols-4 items-start gap-4"><Label className="text-right text-sm mt-3">Siswa</Label><div className="col-span-3 space-y-2">{posFormData.student_ids.length > 0 && (<div className="flex flex-wrap gap-2">{posFormData.student_ids.map((idVal) => { const s = students?.find((st: Student) => String(st.public_id || st.id) === idVal); return (<div key={idVal} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">{s ? s.name : idVal} <button type="button" onClick={() => setPosFormData(prev => ({ ...prev, student_ids: prev.student_ids.filter(i => i !== idVal) }))} className="hover:text-destructive ml-1"><Trash2 className="h-3 w-3" /></button></div>) })}</div>)}<InputSearch placeholder={studentsLoading ? "Memuat..." : "Cari nama/nisn siswa..."} data={students || []} isLoading={studentsLoading} clearOnSelect onSearch={(t) => { if (!students) return []; const lt = t.toLowerCase(); return students.filter((s: Student) => s.name.toLowerCase().includes(lt) || s.nisn?.toLowerCase().includes(lt)) }} keyExtractor={(s: Student) => String(s.public_id || s.id)} renderItem={(s: Student) => <span>{s.name} <span className="text-muted-foreground text-xs ml-2">({s.nisn})</span></span>} onSelect={(s: Student) => { const sId = String(s.public_id || s.id); if (!posFormData.student_ids.includes(sId)) setPosFormData(p => ({ ...p, student_ids: [...p.student_ids, sId] })) }} /></div></div>
                        <div className="grid grid-cols-4 items-start gap-4"><Label className="text-right text-sm mt-3">Perilaku Baik</Label><div className="col-span-3 space-y-2">{posFormData.positive_behavior_id && (<div className="flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-2 rounded-md border border-emerald-200"><span className="font-medium text-sm">{positiveBehaviors?.find((v: PositiveBehavior) => String(v.id) === posFormData.positive_behavior_id)?.name}</span><button type="button" onClick={() => setPosFormData(prev => ({ ...prev, positive_behavior_id: "" }))} className="hover:bg-emerald-200 p-1 rounded-full ml-auto"><Trash2 className="h-3.5 w-3.5" /></button></div>)}{!posFormData.positive_behavior_id && (<InputSearch placeholder="Pilih perilaku baik yang ditunjukkan..." data={positiveBehaviors || []} clearOnSelect onSearch={(t) => { if (!positiveBehaviors) return []; const lt = t.toLowerCase(); return positiveBehaviors.filter((v: PositiveBehavior) => v.name.toLowerCase().includes(lt)) }} keyExtractor={(v: PositiveBehavior) => String(v.id)} renderItem={(v: PositiveBehavior) => <div className="w-full flex justify-between"><span>{v.name}</span><span className="text-emerald-600 font-bold text-xs">-{v.point_value} Poin</span></div>} onSelect={(v: PositiveBehavior) => setPosFormData(p => ({ ...p, positive_behavior_id: String(v.id) }))} />)}</div></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right text-sm">Catatan</Label><Input className="col-span-3" value={posFormData.notes} onChange={(e) => setPosFormData({ ...posFormData, notes: e.target.value })} placeholder="Opsional (Misal: Membawa piala propinsi)" /></div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setIsPosAddOpen(false)}>Batal</Button><Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handlePosCreate} disabled={posCreateMutation.isPending || posFormData.student_ids.length === 0 || !posFormData.positive_behavior_id}>{posCreateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan</Button></DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isPosDeleteOpen} onOpenChange={setIsPosDeleteOpen}><DialogContent><DialogHeader><DialogTitle>Hapus Catatan Positif</DialogTitle><DialogDescription>Yakin hapus catatan <strong>{selectedPosItem?.positive_behavior?.name}</strong> untuk <strong>{selectedPosItem?.student?.name}</strong>?</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setIsPosDeleteOpen(false)}>Batal</Button><Button variant="destructive" onClick={() => posDeleteMutation.mutate(selectedPosItem?.id || 0)} disabled={posDeleteMutation.isPending}>{posDeleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Hapus</Button></DialogFooter></DialogContent></Dialog>
        </div>
    )
}
