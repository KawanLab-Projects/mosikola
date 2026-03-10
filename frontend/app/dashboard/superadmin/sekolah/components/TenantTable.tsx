"use client"

import * as React from "react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MoreHorizontal, ShieldCheck, Mail, Phone, Calendar, Users, Briefcase } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export interface Plan {
    id: number
    name: string
    price: string
    early_bird_price: string | null
    is_active: boolean
}

export type Tenant = {
    id: number
    public_id: string
    name: string
    slug: string
    email: string
    phone: string
    is_active: boolean
    created_at: string
    plan_name: string
    plan_code: string | null
    student_limit: number
    teacher_limit: number
    teachers_count: number
    students_count: number
    upgrade_request: unknown | null
}

export function TenantTable() {
    const [tenants, setTenants] = React.useState<Tenant[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [plans, setPlans] = React.useState<Plan[]>([])

    // Dialog state
    const [selectedTenant, setSelectedTenant] = React.useState<Tenant | null>(null)
    const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = React.useState(false)
    const [selectedPlanId, setSelectedPlanId] = React.useState<string>("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    React.useEffect(() => {
        const fetchTenants = async () => {
            try {
                const [resTenants, resPlans] = await Promise.all([
                    api.get("/superadmin/tenants"),
                    api.get("/superadmin/plans")
                ])
                setTenants(resTenants.data.data)
                setPlans(resPlans.data.data.filter((p: Plan) => p.is_active))
            } catch (error) {
                console.error("Failed to fetch data:", error)
                toast.error("Gagal memuat data sekolah")
            } finally {
                setIsLoading(false)
            }
        }

        fetchTenants()
    }, [])

    const getPlanBadge = (code: string | null, name: string) => {
        switch (code) {
            case 'perintis':
                return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">{name}</Badge>
            case 'favorit':
                return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">{name}</Badge>
            case 'excellence':
                return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">{name}</Badge>
            default:
                return <Badge variant="outline">{name || 'No Plan'}</Badge>
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Daftar Sekolah Terdaftar</CardTitle>
                <CardDescription>Menampilkan semua sekolah yang aktif beserta status langganannya.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                ) : tenants.length === 0 ? (
                    <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center">
                        <ShieldCheck className="h-10 w-10 text-muted-foreground" />
                        <p className="text-lg font-medium">Belum ada sekolah</p>
                        <p className="text-sm text-muted-foreground">Sekolah yang disetujui akan muncul di sini.</p>
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sekolah</TableHead>
                                    <TableHead>Kontak Eksekutif</TableHead>
                                    <TableHead>Paket Langganan</TableHead>
                                    <TableHead>Pengguna</TableHead>
                                    <TableHead>Tanggal Gabung</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tenants.map((tenant) => (
                                    <TableRow key={tenant.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{tenant.name}</span>
                                                <span className="text-xs text-muted-foreground font-mono">{tenant.slug}.mosikola.com</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Mail className="h-3 w-3" />
                                                    <span>{tenant.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Phone className="h-3 w-3" />
                                                    <span>{tenant.phone || '-'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col items-start gap-1">
                                                {getPlanBadge(tenant.plan_code, tenant.plan_name)}
                                                <span className="text-[10px] text-muted-foreground">
                                                    Limit: {tenant.student_limit === 0 ? 'Unlimited' : tenant.student_limit} Siswa
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Briefcase className="h-3 w-3" />
                                                    <span>{tenant.teachers_count} Guru</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Users className="h-3 w-3" />
                                                    <span>{tenant.students_count} Siswa</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                {new Date(tenant.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                                    <DropdownMenuItem>
                                                        Lihat Detail
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-primary font-medium cursor-pointer"
                                                        onClick={() => {
                                                            setSelectedTenant(tenant)
                                                            setSelectedPlanId("")
                                                            setIsUpgradeDialogOpen(true)
                                                        }}
                                                    >
                                                        Ubah Paket Langganan
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>

            <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ubah Paket Langganan</DialogTitle>
                        <DialogDescription>
                            Tentukan paket langganan baru untuk {selectedTenant?.name}. Paket lama akan di-nonaktifkan otomatis.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="plan">Pilih Paket Baru</Label>
                            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih paket..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {plans.map((plan) => (
                                        <SelectItem key={plan.id} value={plan.id.toString()}>
                                            {plan.name} - Rp {parseFloat(plan.price).toLocaleString('id-ID')}
                                            {plan.early_bird_price && ` (Early: Rp ${parseFloat(plan.early_bird_price).toLocaleString('id-ID')})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUpgradeDialogOpen(false)}>Batal</Button>
                        <Button
                            disabled={!selectedPlanId || isSubmitting}
                            onClick={async () => {
                                if (!selectedTenant || !selectedPlanId) return
                                setIsSubmitting(true)
                                try {
                                    await api.post('/superadmin/subscriptions', {
                                        tenant_id: selectedTenant.id,
                                        plan_id: parseInt(selectedPlanId)
                                    })
                                    toast.success("Paket langganan berhasil diubah!")
                                    setIsUpgradeDialogOpen(false)
                                    // Refresh data
                                    const res = await api.get("/superadmin/tenants")
                                    setTenants(res.data.data)
                                } catch (err: unknown) {
                                    toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Gagal mengubah paket langganan")
                                } finally {
                                    setIsSubmitting(false)
                                }
                            }}
                        >
                            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
