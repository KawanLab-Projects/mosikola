"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Search, Truck, CheckCircle2, Clock, PackageOpen, Download, type LucideIcon } from "lucide-react"
import Link from "next/link"

interface Order {
    id: string
    status: string
    created_at: string
    template?: {
        name: string
    }
    creator?: {
        name: string
    }
    payment_method: string
    shipping_receipt_number?: string
    items_count?: number
    items?: unknown[]
    total_price: number
}

export default function RiwayatPesananPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    const fetchOrders = async () => {
        try {
            setLoading(true)
            const res = await api.get('/id-card-orders/my-orders')
            setOrders(res.data)
        } catch {
            toast.error("Gagal memuat riwayat pesanan")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [])

    const filteredOrders = orders.filter(o =>
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.template?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const STATUS_MAP: Record<string, { label: string, color: string, icon: LucideIcon }> = {
        'pending': { label: 'Menunggu Pembayaran', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
        'paid': { label: 'Sudah Dibayar', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
        'on_progress': { label: 'Sedang Dicetak', color: 'bg-blue-100 text-blue-800', icon: PackageOpen },
        'shipping': { label: 'Dalam Pengiriman', color: 'bg-purple-100 text-purple-800', icon: Truck },
        'completed': { label: 'Selesai', color: 'bg-gray-100 text-gray-800', icon: CheckCircle2 }
    }

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Riwayat Pesanan</h1>
                    <p className="text-muted-foreground mt-1">Pantau status pencetakan dan pengiriman kartu siswa</p>
                </div>
                <Link href="/dashboard/kartu-siswa">
                    <Button variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali ke Pemesanan
                    </Button>
                </Link>
            </div>

            <Card className="mb-6 shadow-sm">
                <CardContent className="p-4 flex gap-4 items-center">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari No. Invoice atau Nama Template..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />)}
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
                    <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                    <h3 className="text-lg font-medium text-foreground">Kamu belum pernah membuat pesanan</h3>
                    <p className="text-muted-foreground mt-1 mb-6">Mulai cetak kartu pertamamu sekarang.</p>
                    <Link href="/dashboard/kartu-siswa">
                        <Button>Mulai Pesan Kartu</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map(order => {
                        const StatusIcon = STATUS_MAP[order.status]?.icon || Clock

                        return (
                            <Card key={order.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row">
                                    <div className="bg-muted/30 p-6 md:w-64 border-r flex flex-col justify-center">
                                        <div className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center w-fit mb-3 ${STATUS_MAP[order.status]?.color}`}>
                                            <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                                            {STATUS_MAP[order.status]?.label}
                                        </div>
                                        <p className="text-sm text-muted-foreground font-semibold">NO. INVOICE</p>
                                        <p className="font-bold font-mono text-lg">{order.id}</p>
                                        <p className="text-xs text-muted-foreground mt-4">{new Date(order.created_at).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>

                                    <div className="p-6 flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="font-bold text-lg mb-1">{order.template?.name || 'Template Dihapus'}</h3>

                                            <div className="space-y-2 mt-4 text-sm">
                                                <div className="flex justify-between border-b pb-2 text-muted-foreground">
                                                    <span>Dibuat Oleh</span>
                                                    <span className="font-medium text-foreground">{order.creator?.name || '-'}</span>
                                                </div>
                                                <div className="flex justify-between border-b pb-2 text-muted-foreground">
                                                    <span>Metode Pembayaran</span>
                                                    <span className="font-medium text-foreground uppercase">{order.payment_method}</span>
                                                </div>
                                                <div className="flex justify-between pt-1">
                                                    <span className="font-semibold text-muted-foreground">Resi Pengiriman</span>
                                                    <span className={`font-bold font-mono ${order.shipping_receipt_number ? 'text-blue-600' : 'text-muted-foreground italic'}`}>
                                                        {order.shipping_receipt_number || 'Belum Tersedia'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm text-muted-foreground">Total Item</span>
                                                    <span className="font-bold text-lg">{order.items_count || order.items?.length || 0} <span className="text-sm font-normal text-muted-foreground">Kartu</span></span>
                                                </div>
                                                <div className="flex justify-between border-b pb-3 mb-3">
                                                    <span className="text-sm text-muted-foreground mt-1">Total Tagihan</span>
                                                    <span className="font-bold text-2xl text-primary">Rp {order.total_price.toLocaleString('id-ID')}</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-col gap-2">
                                                {order.status === 'pending' && (
                                                    <Button variant="outline" className="w-full bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                                                        Lanjutkan Pembayaran
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="secondary" className="w-full" onClick={() => window.open(`/print/invoice/${order.id}`, '_blank')}>
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Unduh Detail Invoice
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
