"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import { Loader2, Package, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Tenant {
    name: string
}

interface ShippingInfo {
    name: string
    address: string
    phone: string
}

interface Order {
    id: string
    items_count?: number
    items?: unknown[]
    card_type: 'regular' | 'rfid'
    shipping_info: ShippingInfo
    tenant: Tenant
}

export default function ShippingLabelPage() {
    const params = useParams()
    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await api.get(`/id-card-orders/${params.order_id}`)
                setOrder(res.data.data || res.data)

                // Automatically open print dialog after a short delay to ensure images/fonts load
                setTimeout(() => {
                    window.print()
                }, 1000)
            } catch (err) {
                console.error(err)
                setError(true)
            } finally {
                setLoading(false)
            }
        }

        if (params.order_id) {
            fetchOrder()
        }
    }, [params.order_id])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
                    <p className="text-muted-foreground">Memuat data resi pengiriman...</p>
                </div>
            </div>
        )
    }

    if (error || !order) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow max-w-md">
                    <Package className="h-12 w-12 mx-auto text-red-500 mb-4" />
                    <h2 className="text-xl font-bold mb-2">Gagal Memuat Resi</h2>
                    <p className="text-muted-foreground mb-4">Pesanan tidak ditemukan atau terjadi kesalahan server.</p>
                    <Button onClick={() => window.close()}>Tutup Tab</Button>
                </div>
            </div>
        )
    }

    const itemCount = order.items_count || order.items?.length || 0;
    const isRegular = order.card_type === 'regular';
    const scannerCount = isRegular ? 0 : Math.floor(itemCount / 200);

    return (
        <div className="min-h-screen bg-gray-200 print:bg-white flex items-center justify-center p-4 sm:p-8">
            {/* Action buttons (hidden when printing) */}
            <div className="fixed top-4 right-4 flex gap-2 print:hidden">
                <Button onClick={() => window.print()} className="shadow-lg">
                    <Printer className="w-4 h-4 mr-2" />
                    Cetak Resi
                </Button>
                <Button variant="outline" onClick={() => window.close()} className="shadow-lg bg-white">
                    Tutup
                </Button>
            </div>

            {/* The Label itself */}
            <div className="bg-white w-full max-w-3xl shadow-xl print:shadow-none print:max-w-none print:w-full print:m-0 border border-gray-300 print:border-none p-8 sm:p-12 relative overflow-hidden">

                {/* Visual Decoration */}
                <div className="absolute top-0 left-0 w-full h-4 bg-primary print:bg-black" />

                {/* Header / Origin */}
                <div className="flex justify-between items-start mb-8 pb-8 border-b-2 border-dashed border-gray-300">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-2 uppercase">RESI PENGIRIMAN</h1>
                        <p className="text-gray-500 font-mono text-sm">NO. INVOICE: <span className="text-gray-900 font-bold">{order.id}</span></p>
                    </div>

                    <div className="text-right">
                        <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-1">PENGIRIM</p>
                        <h2 className="text-lg font-bold text-gray-900">PT KawanLab Teknologi Nusantara</h2>
                        <p className="text-sm text-gray-600">Jl. Abdulrahman Moito, Kec. Limboto, Kab. Gorontalo</p>
                        <p className="text-sm text-gray-600">Telp: 0852-4200-0085</p>
                    </div>
                </div>

                {/* Main Content / Destination */}
                <div className="mb-12">
                    <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-3 border-l-4 border-primary pl-3">TUJUAN PENGIRIMAN (PENERIMA)</p>
                    <div className="pl-4">
                        <h2 className="text-2xl font-black text-gray-900 mb-1">{order.shipping_info?.name?.toUpperCase() || '-'}</h2>
                        <h3 className="text-xl font-bold text-gray-700 mb-3">{order.tenant?.name || 'Sekolah Tidak Diketahui'}</h3>

                        <p className="text-lg text-gray-800 max-w-2xl leading-relaxed mb-4">
                            {order.shipping_info?.address}
                        </p>

                        <p className="text-lg font-mono font-bold text-gray-900 bg-gray-100 print:bg-transparent inline-block px-3 py-1 rounded">
                            📞 {order.shipping_info?.phone}
                        </p>
                    </div>
                </div>

                {/* Package Info */}
                <div className="bg-gray-50 print:bg-transparent print:border-2 print:border-gray-900 rounded-xl p-6 border border-gray-200">
                    <h3 className="text-sm text-gray-500 font-bold tracking-widest uppercase mb-4 text-center">ISI PAKET</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white print:bg-transparent border border-gray-200 print:border-gray-400 p-4 rounded-lg flex items-center justify-between col-span-2 sm:col-span-1">
                            <span className="font-medium text-gray-700">Kartu Siswa {isRegular ? '(Reguler)' : '(RFID/NFC)'}</span>
                            <span className="text-2xl font-black text-gray-900">{itemCount} <span className="text-sm font-medium text-gray-500">pcs</span></span>
                        </div>

                        {!isRegular && scannerCount > 0 && (
                            <div className="bg-white print:bg-transparent border border-gray-200 print:border-gray-400 p-4 rounded-lg flex items-center justify-between col-span-2 sm:col-span-1">
                                <span className="font-medium text-gray-700">RFID Scanner Device</span>
                                <span className="text-2xl font-black text-gray-900">{scannerCount} <span className="text-sm font-medium text-gray-500">unit</span></span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Notes */}
                <div className="mt-8 text-center text-xs text-gray-400 print:text-gray-500 space-y-1">
                    <p>Mohon video unboxing saat paket diterima. Komplain tanpa video unboxing tidak akan dilayani.</p>
                    <p>Generated by Mosikola Web Dashboard • {new Date().toLocaleString('id-ID')}</p>
                </div>
            </div>

            {/* Print Styles to hide the body background and center the A4/A5 */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 1cm;
                    }
                    body {
                        background-color: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    )
}
