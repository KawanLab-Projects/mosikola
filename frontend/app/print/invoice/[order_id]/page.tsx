"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import { Loader2, Package, Printer, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Tenant {
    id: string;
    name: string;
}

interface ShippingInfo {
    name: string;
    address: string;
    phone: string;
}

interface Creator {
    id: string;
    name: string;
}

interface Template {
    id: string;
    name: string;
}

interface OrderItem {
    id: string;
    student_name?: string;
    student_id?: string;
}

interface Order {
    id: string;
    created_at: string;
    status: string;
    total_price: number;
    items_count?: number;
    items?: OrderItem[];
    card_type: string;
    payment_method: string;
    tenant?: Tenant;
    shipping_info?: ShippingInfo;
    creator?: Creator;
    template?: Template;
}

export default function InvoicePage() {
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
                    <p className="text-muted-foreground">Memuat data invoice...</p>
                </div>
            </div>
        )
    }

    if (error || !order) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow max-w-md">
                    <Package className="h-12 w-12 mx-auto text-red-500 mb-4" />
                    <h2 className="text-xl font-bold mb-2">Gagal Memuat Invoice</h2>
                    <p className="text-muted-foreground mb-4">Pesanan tidak ditemukan atau terjadi kesalahan server.</p>
                    <Button onClick={() => window.close()}>Tutup Tab</Button>
                </div>
            </div>
        )
    }

    const itemCount = order.items_count || order.items?.length || 0;
    const isRegular = order.card_type === 'regular';
    const scannerCount = isRegular ? 0 : Math.floor(itemCount / 200);

    // Calculate item pricing
    const unitPrice = order.total_price / (itemCount > 0 ? itemCount : 1);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    return (
        <div className="min-h-screen bg-gray-200 print:bg-white flex items-center justify-center p-4 sm:p-8">
            {/* Action buttons (hidden when printing) */}
            <div className="fixed top-4 right-4 flex gap-2 print:hidden z-50">
                <Button onClick={() => window.print()} className="shadow-lg">
                    <Printer className="w-4 h-4 mr-2" />
                    Cetak Invoice
                </Button>
                <Button variant="outline" onClick={() => window.close()} className="shadow-lg bg-white">
                    Tutup
                </Button>
            </div>

            {/* The Invoice A4 Paper */}
            <div className="bg-white w-full max-w-[21cm] min-h-[29.7cm] shadow-xl print:shadow-none print:max-w-none print:w-full print:m-0 print:border-none p-8 sm:p-12 relative overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-start mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-primary p-2 rounded-lg">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight text-gray-900 uppercase">INVOICE</h1>
                        </div>
                        <p className="text-gray-500 font-medium text-sm">NO. INVOICE</p>
                        <p className="text-gray-900 font-bold font-mono text-lg">{order.id}</p>

                        <div className="mt-4 flex gap-8">
                            <div>
                                <p className="text-gray-500 font-medium text-sm">Tanggal Tagihan</p>
                                <p className="text-gray-900 font-semibold">{formatDate(order.created_at)}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 font-medium text-sm">Status Pembayaran</p>
                                <p className={`font-bold ${order.status === 'pending' ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {order.status === 'pending' ? 'BELUM LUNAS' : 'LUNAS'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-1">DITERBITKAN OLEH</p>
                        <h2 className="text-lg font-bold text-gray-900">PT KawanLab Teknologi Nusantara</h2>
                        <p className="text-sm text-gray-600 mt-1">Jl. Abdulrahman Moito, Kec. Limboto<br />Kab. Gorontalo, Gorontalo</p>
                        <p className="text-sm text-gray-600">Telp: 0852-4200-0085</p>
                    </div>
                </div>

                <div className="h-px bg-gray-200 mb-8 w-full"></div>

                {/* Billed To */}
                <div className="mb-12">
                    <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-3">DITAGIHKAN KEPADA</p>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-1">{order.tenant?.name || 'Sekolah Tidak Diketahui'}</h2>
                        <h3 className="text-base font-semibold text-gray-700 mb-2">Attn: {order.shipping_info?.name || order.creator?.name || '-'}</h3>

                        <p className="text-sm text-gray-600 leading-relaxed max-w-sm mb-2">
                            {order.shipping_info?.address || '-'}
                        </p>

                        <p className="text-sm text-gray-700">
                            <strong>No. Telp:</strong> {order.shipping_info?.phone || '-'}
                        </p>
                    </div>
                </div>

                {/* Invoice Items Table */}
                <div className="mb-12">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-gray-300">
                                <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-2/3">Deskripsi Produk</th>
                                <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Qty</th>
                                <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Harga Satuan</th>
                                <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <tr>
                                <td className="py-4 px-4">
                                    <p className="font-bold text-gray-900">Pencetakan Kartu Siswa {isRegular ? '(Reguler - Standar)' : '(RFID/NFC)'}</p>
                                    <p className="text-sm text-gray-500 mt-1">Template: {order.template?.name || 'Custom'}</p>
                                </td>
                                <td className="py-4 px-4 text-right font-medium text-gray-900">{itemCount}</td>
                                <td className="py-4 px-4 text-right font-medium text-gray-900">Rp {unitPrice.toLocaleString('id-ID')}</td>
                                <td className="py-4 px-4 text-right font-bold text-gray-900">Rp {order.total_price.toLocaleString('id-ID')}</td>
                            </tr>

                            {!isRegular && scannerCount > 0 && (
                                <tr>
                                    <td className="py-4 px-4">
                                        <p className="font-bold text-gray-900">Bonus RFID Scanner Device</p>
                                        <p className="text-sm text-gray-500 mt-1">Promo setiap kelipatan 200 kartu</p>
                                    </td>
                                    <td className="py-4 px-4 text-right font-medium text-gray-900">{scannerCount}</td>
                                    <td className="py-4 px-4 text-right font-medium text-gray-900">Rp 0</td>
                                    <td className="py-4 px-4 text-right font-bold text-gray-900">Rp 0</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Invoice Summary */}
                <div className="flex justify-end mb-16">
                    <div className="w-80 bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-3 text-gray-600">
                            <span>Subtotal</span>
                            <span className="font-medium">Rp {order.total_price.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center mb-3 text-gray-600">
                            <span>Pajak (0%)</span>
                            <span className="font-medium">Rp 0</span>
                        </div>
                        <div className="h-px bg-gray-300 w-full my-3"></div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-900 text-lg">Total Tagihan</span>
                            <span className="font-black text-primary text-xl">Rp {order.total_price.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>

                {/* Additional Info / Footer */}
                <div className="border-t-2 border-gray-200 pt-8 mt-auto flex justify-between items-end">
                    <div>
                        <h4 className="font-bold text-gray-900 mb-2">Metode Pembayaran</h4>
                        <p className="text-gray-600 text-sm uppercase font-medium">{order.payment_method}</p>

                        {order.status === 'pending' && order.payment_method === 'transfer' && (
                            <div className="mt-3 bg-blue-50 text-blue-800 p-3 rounded text-sm border border-blue-100 max-w-sm">
                                <p className="font-bold mb-1">Informasi Transfer Bank:</p>
                                <p>Bank Mandiri: <strong>150-00-1234567-8</strong></p>
                                <p>A.n. PT KawanLab Teknologi Nusantara</p>
                            </div>
                        )}
                    </div>

                    <div className="text-right">
                        <p className="text-xs text-gray-400 font-medium">Terima kasih atas pesanan Anda.</p>
                        <p className="text-xs text-gray-400 mt-1">Generated by Mosikola Web Dashboard</p>
                    </div>
                </div>

            </div>

            {/* Print Styles to hide the body background and center the A4 */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
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
