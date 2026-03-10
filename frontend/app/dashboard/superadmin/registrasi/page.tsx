"use client";

import { useEffect, useState, useCallback } from "react"
import { api } from "@/lib/api"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Loader2, CheckCircle2, Mail, Phone, Calendar } from "lucide-react"

interface Registration {
    id: number
    school_name: string
    slug: string
    email: string
    phone: string
    contact_person: string
    status: 'pending' | 'approved' | 'rejected'
    created_at: string
}

export default function RegistrasiPage() {
    const [registrations, setRegistrations] = useState<Registration[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<number | null>(null)

    const fetchRegistrations = useCallback(async () => {
        setLoading(true)
        try {
            const response = await api.get("/registrations")
            setRegistrations(response.data.data)
        } catch {
            toast.error("Gagal mengambil data pendaftaran")
        } finally {
            setLoading(false)
        }
    }, [])

    const handleApprove = async (id: number) => {
        setProcessingId(id)
        try {
            await api.post(`/registrations/${id}/approve`)
            toast.success("Pendaftaran berhasil disetujui")
            fetchRegistrations()
        } catch (error: unknown) {
            toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Gagal menyetujui pendaftaran")
        } finally {
            setProcessingId(null)
        }
    }

    useEffect(() => {
        fetchRegistrations()
    }, [fetchRegistrations])

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
            case 'approved':
                return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Disetujui</Badge>
            case 'rejected':
                return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Ditolak</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-6 p-1">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manajemen Pendaftaran</h1>
                    <p className="text-muted-foreground">Kelola dan setujui pendaftaran sekolah baru.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Calon Sekolah</CardTitle>
                    <CardDescription>Menampilkan semua pendaftaran yang masuk ke sistem.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex h-[200px] items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : registrations.length === 0 ? (
                        <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center">
                            <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
                            <p className="text-lg font-medium">Tidak ada pendaftaran</p>
                            <p className="text-sm text-muted-foreground">Pendaftaran baru akan muncul di sini.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sekolah</TableHead>
                                        <TableHead>Kontak PIC</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {registrations.map((reg) => (
                                        <TableRow key={reg.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{reg.school_name}</span>
                                                    <span className="text-xs text-muted-foreground font-mono">{reg.slug}.mosikola.com</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">{reg.contact_person}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Mail className="h-3 w-3" />
                                                        <span>{reg.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Phone className="h-3 w-3" />
                                                        <span>{reg.phone}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(reg.status)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {new Date(reg.created_at).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {reg.status === 'pending' && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button size="sm" className="gap-2">
                                                                {processingId === reg.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                )}
                                                                Setujui
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Setujui Pendaftaran?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Tindakan ini akan membuat tenant baru untuk <strong>{reg.school_name}</strong> dan mengirimkan email akses ke PIC.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleApprove(reg.id)} disabled={processingId === reg.id}>
                                                                    Ya, Setujui
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}