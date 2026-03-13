"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Edit, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { formatRupiah } from "@/lib/utils"

interface PlanFeatures {
    algorithmic_schedule_generator?: boolean
    absensi_reguler?: boolean
    jurnal_mapel?: boolean
    absensi_mapel?: boolean
    piket?: boolean
    bimbingan_konseling?: boolean
    import_schedule?: boolean
    kiosk?: boolean
    ai_counseling?: boolean
    basic_ews?: boolean
    ai_analytics?: boolean
}

interface Plan {
    id: number
    name: string
    code: string
    student_limit: number | null
    teacher_limit: number | null
    price: string
    early_bird_price: string | null
    early_bird_limit: number | null
    attendance_enabled: boolean
    parent_monitoring_enabled: boolean
    notification_enabled: boolean
    features: PlanFeatures | null
    is_active: boolean
}

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false)
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        student_limit: "",
        teacher_limit: "",
        price: "0",
        early_bird_price: "",
        early_bird_limit: "",
        attendance_enabled: false,
        parent_monitoring_enabled: false,
        notification_enabled: false,
        is_active: true,
        // Default features (on by default for all plans)
        features_algorithmic_schedule: true,
        features_absensi_reguler: true,
        features_jurnal_mapel: true,
        features_absensi_mapel: true,
        features_piket: true,
        features_bimbingan_konseling: true,
        features_kiosk: true,
        // Premium features (off by default)
        features_import_schedule: false,
        features_ai_counseling: false,
        features_basic_ews: false,
        features_ai_analytics: false,
    })

    const fetchPlans = useCallback(async () => {
        try {
            const res = await api.get("/superadmin/plans")
            setPlans(res.data.data)
        } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Gagal mengambil data paket")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchPlans()
    }, [fetchPlans])

    const handleOpenDialog = (plan?: Plan) => {
        if (plan) {
            setEditingPlan(plan)
            setFormData({
                name: plan.name,
                code: plan.code,
                student_limit: plan.student_limit?.toString() || "",
                teacher_limit: plan.teacher_limit?.toString() || "",
                price: parseFloat(plan.price).toString(),
                early_bird_price: plan.early_bird_price ? parseFloat(plan.early_bird_price).toString() : "",
                early_bird_limit: plan.early_bird_limit?.toString() || "",
                attendance_enabled: plan.attendance_enabled,
                parent_monitoring_enabled: plan.parent_monitoring_enabled,
                notification_enabled: plan.notification_enabled,
                is_active: plan.is_active,
                features_algorithmic_schedule: plan.features?.algorithmic_schedule_generator ?? true,
                features_absensi_reguler: plan.features?.absensi_reguler ?? true,
                features_jurnal_mapel: plan.features?.jurnal_mapel ?? true,
                features_absensi_mapel: plan.features?.absensi_mapel ?? true,
                features_piket: plan.features?.piket ?? true,
                features_kiosk: plan.features?.kiosk ?? true,
                features_bimbingan_konseling: plan.features?.bimbingan_konseling ?? true,
                features_import_schedule: plan.features?.import_schedule || false,
                features_ai_counseling: plan.features?.ai_counseling || false,
                features_basic_ews: plan.features?.basic_ews || false,
                features_ai_analytics: plan.features?.ai_analytics || false,
            })
        } else {
            setEditingPlan(null)
            setFormData({
                name: "",
                code: "",
                student_limit: "",
                teacher_limit: "",
                price: "0",
                early_bird_price: "",
                early_bird_limit: "",
                attendance_enabled: false,
                parent_monitoring_enabled: false,
                notification_enabled: false,
                is_active: true,
                // Default features
                features_algorithmic_schedule: true,
                features_absensi_reguler: true,
                features_jurnal_mapel: true,
                features_absensi_mapel: true,
                features_piket: true,
                features_bimbingan_konseling: true,
                features_kiosk: true,
                // Premium features
                features_import_schedule: false,
                features_ai_counseling: false,
                features_basic_ews: false,
                features_ai_analytics: false,
            })
        }
        setIsOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const payload = {
            ...formData,
            student_limit: formData.student_limit ? parseInt(formData.student_limit) : null,
            teacher_limit: formData.teacher_limit ? parseInt(formData.teacher_limit) : null,
            early_bird_limit: formData.early_bird_limit ? parseInt(formData.early_bird_limit) : null,
            early_bird_price: formData.early_bird_price !== "" ? parseFloat(formData.early_bird_price) : null,
            price: parseFloat(formData.price),
            features: {
                algorithmic_schedule_generator: formData.features_algorithmic_schedule,
                jurnal_mapel: formData.features_jurnal_mapel,
                absensi_mapel: formData.features_absensi_mapel,
                piket: formData.features_piket,
                bimbingan_konseling: formData.features_bimbingan_konseling,
                import_schedule: formData.features_import_schedule,
                ai_counseling: formData.features_ai_counseling,
                basic_ews: formData.features_basic_ews,
                ai_analytics: formData.features_ai_analytics,
            }
        }

        try {
            if (editingPlan) {
                await api.put(`/superadmin/plans/${editingPlan.id}`, payload)
                toast.success("Paket berhasil diperbarui")
            } else {
                await api.post("/superadmin/plans", payload)
                toast.success("Paket berhasil ditambahkan")
            }
            setIsOpen(false)
            fetchPlans()
        } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Gagal menyimpan paket")
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Apakah Anda yakin ingin menghapus paket ini?")) return

        try {
            await api.delete(`/superadmin/plans/${id}`)
            toast.success("Paket berhasil dihapus")
            fetchPlans()
        } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Gagal menghapus paket")
        }
    }

    if (isLoading) return <div className="p-6">Memuat konfigurasi paket...</div>

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Konfigurasi Paket Layanan</h1>
                <Button onClick={() => handleOpenDialog()}><Plus className="w-4 h-4 mr-2" /> Tambah Paket</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Paket</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead>Kode</TableHead>
                                <TableHead>Harga</TableHead>
                                <TableHead>Early Bird</TableHead>
                                <TableHead>Batas Guru/Siswa</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {plans.map((plan) => (
                                <TableRow key={plan.id}>
                                    <TableCell className="font-medium">{plan.name}</TableCell>
                                    <TableCell>{plan.code}</TableCell>
                                    <TableCell>{formatRupiah(parseFloat(plan.price))}</TableCell>
                                    <TableCell>
                                        {plan.early_bird_price && plan.early_bird_limit ? (
                                            <span className="text-teal-600 font-semibold text-xs border border-teal-200 bg-teal-50 px-2 py-1 rounded">
                                                {formatRupiah(parseFloat(plan.early_bird_price))} (Limit: {plan.early_bird_limit})
                                            </span>
                                        ) : "-"}
                                    </TableCell>
                                    <TableCell>
                                        {plan.teacher_limit || "∞"} / {plan.student_limit || "∞"}
                                    </TableCell>
                                    <TableCell>{plan.is_active ? "Aktif" : "Nonaktif"}</TableCell>
                                    <TableCell className="text-right flex justify-end gap-2">
                                        <Button variant="outline" size="icon" onClick={() => handleOpenDialog(plan)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button variant="destructive" size="icon" onClick={() => handleDelete(plan.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingPlan ? "Edit Paket" : "Tambah Paket Baru"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nama Paket</Label>
                                <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Kode Internal</Label>
                                <Input required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Harga Normal (Rp)</Label>
                                <Input type="number" required min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Harga Early Bird (Rp)</Label>
                                <Input type="number" min="0" value={formData.early_bird_price} onChange={(e) => setFormData({ ...formData, early_bird_price: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Limit Early Bird (Jumlah Pendaftar)</Label>
                            <Input type="number" min="0" value={formData.early_bird_limit} onChange={(e) => setFormData({ ...formData, early_bird_limit: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Batas Maksimal Guru</Label>
                                <Input type="number" placeholder="Kosongkan untuk unlimited" value={formData.teacher_limit} onChange={(e) => setFormData({ ...formData, teacher_limit: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Batas Maksimal Siswa</Label>
                                <Input type="number" placeholder="Kosongkan untuk unlimited" value={formData.student_limit} onChange={(e) => setFormData({ ...formData, student_limit: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t">
                            <h4 className="font-semibold text-sm">Fitur Dasar (Aktif di semua paket)</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="f-gen" checked={formData.features_algorithmic_schedule} onCheckedChange={(c: boolean | "indeterminate") => setFormData({ ...formData, features_algorithmic_schedule: c === true })} />
                                    <Label htmlFor="f-gen">Generator Jadwal Algoritmik</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="f-jurnal" checked={formData.features_absensi_reguler} onCheckedChange={(c: boolean | "indeterminate") => setFormData({ ...formData, features_absensi_reguler: c === true })} />
                                    <Label htmlFor="f-jurnal">Absensi Harian</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="f-jurnal" checked={formData.features_jurnal_mapel} onCheckedChange={(c: boolean | "indeterminate") => setFormData({ ...formData, features_jurnal_mapel: c === true })} />
                                    <Label htmlFor="f-jurnal">Jurnal Mapel</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="f-absensi" checked={formData.features_absensi_mapel} onCheckedChange={(c: boolean | "indeterminate") => setFormData({ ...formData, features_absensi_mapel: c === true })} />
                                    <Label htmlFor="f-absensi">Absensi Mapel</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="f-piket" checked={formData.features_piket} onCheckedChange={(c: boolean | "indeterminate") => setFormData({ ...formData, features_piket: c === true })} />
                                    <Label htmlFor="f-piket">Piket</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="f-bk" checked={formData.features_bimbingan_konseling} onCheckedChange={(c: boolean | "indeterminate") => setFormData({ ...formData, features_bimbingan_konseling: c === true })} />
                                    <Label htmlFor="f-bk">Bimbingan Konseling</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="f-kiosk" checked={formData.features_kiosk} onCheckedChange={(c: boolean | "indeterminate") => setFormData({ ...formData, features_kiosk: c === true })} />
                                    <Label htmlFor="f-kiosk">Anjungan Sekolah</Label>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t">
                            <h4 className="font-semibold text-sm">Fitur Premium</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="import" checked={formData.features_import_schedule} onCheckedChange={(c: boolean | "indeterminate") => setFormData({ ...formData, features_import_schedule: c === true })} />
                                    <Label htmlFor="import">Import Jadwal XML</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="ai-bk" checked={formData.features_ai_counseling} onCheckedChange={(c: boolean | "indeterminate") => setFormData({ ...formData, features_ai_counseling: c === true })} />
                                    <Label htmlFor="ai-bk">AI Helper BK</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="basic-ews" checked={formData.features_basic_ews} onCheckedChange={(c: boolean | "indeterminate") => setFormData({ ...formData, features_basic_ews: c === true })} />
                                    <Label htmlFor="basic-ews">Basic EWS</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="ai-analytics" checked={formData.features_ai_analytics} onCheckedChange={(c: boolean | "indeterminate") => setFormData({ ...formData, features_ai_analytics: c === true })} />
                                    <Label htmlFor="ai-analytics">AI & EWS Analitik Full</Label>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-4 border-t">
                            <Checkbox id="active" checked={formData.is_active} onCheckedChange={(c: boolean | "indeterminate") => setFormData({ ...formData, is_active: c === true })} />
                            <Label htmlFor="active">Paket Aktif</Label>
                        </div>

                        <DialogFooter>
                            <Button type="submit">Simpan Paket</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
