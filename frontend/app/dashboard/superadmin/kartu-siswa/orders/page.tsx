"use client"

import { useState, useEffect, useRef, FormEvent, useCallback } from "react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Truck, Search, CheckCircle2, Clock, PackageOpen, Download, Loader2, Printer, RefreshCw } from "lucide-react"
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import IdCardPrintCanvas from '@/components/IdCardPrintCanvas'
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScanFace, Check, ChevronRight, X } from "lucide-react"

interface Student {
    public_id: string;
    name: string;
    nisn: string;
    nfc_uid?: string;
    address?: string;
    birth_place?: string;
    birth_date?: string;
}

interface PrintSnapshot {
    name: string;
    nisn: string;
    birth_place?: string;
    birth_date?: string;
}

interface OrderItem {
    id: string;
    student: Student | null;
    print_snapshot: PrintSnapshot;
    photo_path: string;
    photo_url?: string;
}

interface Order {
    id: string;
    status: string;
    created_at: string;
    total_price: number;
    shipping_receipt_number?: string;
    card_type: 'regular' | 'rfid';
    items_count?: number;
    items?: OrderItem[];
    tenant?: {
        name: string;
    };
    template: {
        name: string;
        background_path: string;
        background_url: string;
        back_background_path: string;
        back_background_url: string;
        canvas_state: {
            elements: Record<string, unknown>;
            layout: string;
        };
    };
    shipping_info?: {
        name: string;
        phone: string;
        address: string;
    };
}

export default function SuperadminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    const [downloadingZip, setDownloadingZip] = useState<{ [key: string]: boolean }>({})
    const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: { current: number, total: number } }>({})

    // RFID Scan State
    const [scanModalOpen, setScanModalOpen] = useState(false)
    const [scanningOrder, setScanningOrder] = useState<Order | null>(null)
    const [scanningItems, setScanningItems] = useState<OrderItem[]>([])
    const [currentScanIndex, setCurrentScanIndex] = useState(0)
    const [rfidInput, setRfidInput] = useState("")
    const [isSavingRfid, setIsSavingRfid] = useState(false)
    const rfidInputRef = useRef<HTMLInputElement>(null)

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true)
            const res = await api.get('/superadmin/id-card-orders')
            setOrders(res.data)
        } catch {
            toast.error("Gagal memuat pesanan kartu siswa")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchOrders()
    }, [fetchOrders])

    useEffect(() => {
        if (scanModalOpen) {
            setTimeout(() => {
                rfidInputRef.current?.focus()
            }, 500)

            const handleGlobalKeyDown = (e: KeyboardEvent) => {
                if (document.activeElement !== rfidInputRef.current && e.key !== 'Escape') {
                    rfidInputRef.current?.focus()
                }
            }

            document.addEventListener('keydown', handleGlobalKeyDown)
            return () => document.removeEventListener('keydown', handleGlobalKeyDown)
        }
    }, [scanModalOpen])

    const handleStartScan = async (orderId: string) => {
        try {
            toast.loading("Memuat data siswa...", { id: "loading-scan" })
            const res = await api.get(`/superadmin/id-card-orders/${orderId}/download`)
            const data = res.data
            const items = data.order.items || []

            if (items.length === 0) {
                toast.dismiss("loading-scan")
                toast.error("Pesanan ini tidak memiliki data siswa")
                return
            }

            setScanningOrder(data.order)
            setScanningItems(items)

            const firstUnscanned = items.findIndex((i: OrderItem) => !i.student?.nfc_uid)
            setCurrentScanIndex(firstUnscanned >= 0 ? firstUnscanned : 0)

            setRfidInput("")
            setScanModalOpen(true)
            toast.dismiss("loading-scan")
        } catch {
            toast.dismiss("loading-scan")
            toast.error("Gagal memuat data siswa untuk order ini")
        }
    }

    const handleRfidSubmit = async (e?: FormEvent) => {
        if (e) e.preventDefault();

        if (!rfidInput.trim()) return;

        const currentItem = scanningItems[currentScanIndex];
        if (!currentItem || !currentItem.student || !scanningOrder) return;

        setIsSavingRfid(true)
        try {
            await api.put(`/superadmin/id-card-orders/${scanningOrder.id}/students/${currentItem.student.public_id}/nfc-uid`, {
                nfc_uid: rfidInput.trim()
            })

            toast.success(`RFID berhasil disimpan untuk ${currentItem.student.name || currentItem.print_snapshot?.name}`)

            const newItems = [...scanningItems]
            newItems[currentScanIndex] = {
                ...currentItem,
                student: { ...currentItem.student, nfc_uid: rfidInput.trim() }
            }
            setScanningItems(newItems)

            setRfidInput("")
            if (currentScanIndex < scanningItems.length - 1) {
                setCurrentScanIndex(currentScanIndex + 1)
            } else {
                toast.success("Semua siswa dalam order ini telah di-scan!")
            }

            setTimeout(() => rfidInputRef.current?.focus(), 100)
        } catch {
            toast.error("Gagal menyimpan RFID")
            setTimeout(() => rfidInputRef.current?.focus(), 100)
        } finally {
            setIsSavingRfid(false)
        }
    }

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            await api.put(`/superadmin/id-card-orders/${orderId}`, { status: newStatus })
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
            toast.success("Status pesanan diperbarui")
        } catch {
            toast.error("Gagal memperbarui status")
        }
    }

    const handleReceiptChange = async (orderId: string, receipt: string) => {
        try {
            await api.put(`/superadmin/id-card-orders/${orderId}`, { shipping_receipt_number: receipt })
            setOrders(orders.map(o => o.id === orderId ? { ...o, shipping_receipt_number: receipt } : o))
            toast.success("Resi pengiriman disimpan")
        } catch {
            toast.error("Gagal menyimpan resi pengiriman")
        }
    }

    const handleDownloadAssets = async (orderId: string) => {
        try {
            setDownloadingZip(prev => ({ ...prev, [orderId]: true }))
            setDownloadProgress(prev => ({ ...prev, [orderId]: { current: 0, total: 0 } }))

            // 1. Fetch full order details
            const res = await api.get(`/superadmin/id-card-orders/${orderId}/download`)
            const data = res.data
            const order = data.order
            const schoolData = data.schoolData
            const items = order.items

            if (!items || items.length === 0) {
                toast.error("Tidak ada data siswa untuk dicetak")
                return
            }

            setDownloadProgress(prev => ({ ...prev, [orderId]: { current: 0, total: items.length } }))

            const canvasState = order.template.canvas_state.elements
            const layoutRaw = order.template.canvas_state.layout || 'portrait'
            const isPortraitLayout = layoutRaw === 'vertical' || layoutRaw === 'portrait'
            const exportWidth = isPortraitLayout ? 400 : 600
            const exportHeight = isPortraitLayout ? 600 : 400

            const zip = new JSZip()

            // Dynamically import dom-to-image to prevent Next.js SSR document undefined crashes
            const domtoimage = (await import('dom-to-image-more')).default;

            // Pre-fetch all unique font families from the template as base64 CSS BEFORE rendering.
            // This ensures every card gets the same fonts, unlike useEffect which is async and unreliable.
            const fontFamilies = new Set<string>();
            const webFonts = ['Poppins', 'Roboto', 'Lato', 'Montserrat', 'Nunito', 'Raleway'];
            Object.values(canvasState).forEach((el: unknown) => {
                const element = el as { fontFamily?: string };
                if (element?.fontFamily && webFonts.includes(element.fontFamily)) fontFamilies.add(element.fontFamily);
            })
            const fontCssChunks = await Promise.all(
                [...fontFamilies].map(family =>
                    fetch(`/api/proxy-font-css?family=${encodeURIComponent(family)}`).then(r => r.text()).catch(() => '')
                )
            )
            const inlineFontCss = fontCssChunks.join('\n')

            // Create a hidden container wrapper for dom-to-image rendering
            const wrapper = document.createElement('div')
            wrapper.style.position = 'fixed'
            wrapper.style.top = '200%' // Keep it off-screen
            wrapper.style.left = '0'
            wrapper.style.zIndex = '-9999'

            // CRUCIAL: Remove Tailwind CSS variable inheritance that causes html2canvas to fail parsing lab() colors
            wrapper.style.color = '#000000'
            wrapper.style.background = '#ffffff'

            // Absolutely forceful reset of tailwind CSS variables so html2canvas doesn't try to inherit them from the body
            wrapper.style.cssText += '; --tw-border-spacing-x: 0; --tw-border-spacing-y: 0; --tw-translate-x: 0; --tw-translate-y: 0; --tw-rotate: 0; --tw-skew-x: 0; --tw-skew-y: 0; --tw-scale-x: 1; --tw-scale-y: 1; --tw-pan-x:  ; --tw-pan-y:  ; --tw-pinch-zoom:  ; --tw-scroll-snap-strictness: proximity; --tw-gradient-from-position:  ; --tw-gradient-via-position:  ; --tw-gradient-to-position:  ; --tw-ordinal:  ; --tw-slashed-zero:  ; --tw-numeric-figure:  ; --tw-numeric-spacing:  ; --tw-numeric-fraction:  ; --tw-ring-inset:  ; --tw-ring-offset-width: 0px; --tw-ring-offset-color: #fff; --tw-ring-color: rgb(59 130 246 / 0.5); --tw-ring-offset-shadow: 0 0 #0000; --tw-ring-shadow: 0 0 #0000; --tw-shadow: 0 0 #0000; --tw-shadow-colored: 0 0 #0000; --tw-blur:  ; --tw-brightness:  ; --tw-contrast:  ; --tw-grayscale:  ; --tw-hue-rotate:  ; --tw-invert:  ; --tw-saturate:  ; --tw-sepia:  ; --tw-drop-shadow:  ; --tw-backdrop-blur:  ; --tw-backdrop-brightness:  ; --tw-backdrop-contrast:  ; --tw-backdrop-grayscale:  ; --tw-backdrop-hue-rotate:  ; --tw-backdrop-invert:  ; --tw-backdrop-opacity:  ; --tw-backdrop-saturate:  ; --tw-backdrop-sepia:  ;'

            // Prevent inheritance completely 
            wrapper.className = 'canvas-pdf-export-wrapper'

            document.body.appendChild(wrapper)

            const root = createRoot(wrapper)

            // Hardcode slight delay to allow cross-origin images to load into DOM before canvas snapshots them
            const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

            // Filter out cross-origin stylesheets (like Google Fonts) to prevent CSSRule SecurityError
            const filterNode = (node: Node) => {
                const element = node as HTMLElement;
                if (element.tagName === 'LINK' && element.getAttribute('rel') === 'stylesheet' && element.getAttribute('href')) {
                    const href = element.getAttribute('href')!;
                    if (href.startsWith('http') && !href.includes(window.location.host)) {
                        return false; // Skip cross-origin stylesheets
                    }
                }
                return true;
            };

            // --------- Render BACK Side (ONCE PER ORDER) ---------
            const firstItem = items[0]
            const dummyStudentData = {
                name: firstItem.print_snapshot.name || firstItem.student?.name || '',
                nisn: firstItem.print_snapshot.nisn || firstItem.student?.nisn || '',
                birth_place: firstItem.print_snapshot.birth_place || firstItem.student?.birth_place,
                birth_date: firstItem.print_snapshot.birth_date || firstItem.student?.birth_date,
                address: firstItem.student?.address || '',
                photo_url: firstItem.photo_url || firstItem.photo_path
            }

            flushSync(() => {
                root.render(
                    <IdCardPrintCanvas
                        side="back"
                        layout={layoutRaw}
                        backgroundUrl={order.template.back_background_url || order.template.back_background_path}
                        canvasState={canvasState}
                        inlineFontCss={inlineFontCss}
                        studentData={dummyStudentData}
                        schoolData={schoolData}
                    />
                )
            })

            await delay(1000) // extra time for back side to load background

            try {
                const backBlob = await domtoimage.toBlob(wrapper.firstElementChild as HTMLElement, {
                    scale: 2,
                    width: exportWidth,
                    height: exportHeight,
                    filter: filterNode
                })
                if (backBlob) {
                    zip.file(`00_Desain_Belakang.png`, backBlob)
                }
            } catch (e) {
                console.error("DOM To Image failed back", e)
            }

            for (let i = 0; i < items.length; i++) {
                const item = items[i]
                const student = item.student

                const studentData = {
                    name: item.print_snapshot.name || student?.name || '',
                    nisn: item.print_snapshot.nisn || student?.nisn || '',
                    birth_place: item.print_snapshot.birth_place || student?.birth_place,
                    birth_date: item.print_snapshot.birth_date || student?.birth_date,
                    address: student?.address || '',
                    photo_url: item.photo_url || item.photo_path
                }

                // --------- Render FRONT Side ---------
                flushSync(() => {
                    root.render(
                        <IdCardPrintCanvas
                            side="front"
                            layout={layoutRaw}
                            backgroundUrl={order.template.background_url || order.template.background_path}
                            canvasState={canvasState}
                            inlineFontCss={inlineFontCss}
                            studentData={studentData}
                            schoolData={schoolData}
                        />
                    )
                })

                // Allow extra time for font-proxy fetch and React render + image loading
                await delay(1500)

                try {
                    const frontBlob = await domtoimage.toBlob(wrapper.firstElementChild as HTMLElement, {
                        scale: 2,
                        width: exportWidth,
                        height: exportHeight,
                        filter: filterNode
                    })
                    if (frontBlob) {
                        zip.file(`${studentData.nisn}_${studentData.name.replace(/[^a-zA-Z0-9]/g, '_')}_Depan.png`, frontBlob)
                    }
                } catch (e) {
                    console.error("DOM To Image failed front", e)
                }

                // Update progress
                setDownloadProgress(prev => ({ ...prev, [orderId]: { current: i + 1, total: items.length } }))
            }

            // Clean up off-screen renderer
            root.unmount()
            document.body.removeChild(wrapper)

            toast.info("Sukses memproses gambar. Mengkompresi menjadi file ZIP...")
            const content = await zip.generateAsync({ type: 'blob' })
            saveAs(content, `Order_${orderId}_${order.tenant?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Aset'}.zip`)
            toast.success("Berhasil mengunduh aset cetak!")

        } catch (error) {
            console.error(error)
            toast.error("Gagal men-generate aset cetak")
        } finally {
            setDownloadingZip(prev => ({ ...prev, [orderId]: false }))
        }
    }

    const filteredOrders = orders.filter(o =>
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const STATUS_MAP: Record<string, { label: string, color: string, icon: React.ComponentType<{ className?: string }> }> = {
        'pending': { label: 'Menunggu Pembayaran', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
        'paid': { label: 'Sudah Dibayar', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
        'on_progress': { label: 'Sedang Dicetak', color: 'bg-blue-100 text-blue-800', icon: PackageOpen },
        'shipping': { label: 'Dalam Pengiriman', color: 'bg-purple-100 text-purple-800', icon: Truck },
        'completed': { label: 'Selesai', color: 'bg-gray-100 text-gray-800', icon: CheckCircle2 }
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Manajemen Pesanan Kartu</h1>
                    <p className="text-muted-foreground">Kelola pencetakan dan pengiriman Kartu Siswa ke sekolah</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchOrders}
                    disabled={loading}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Card className="mb-6">
                <CardContent className="p-4 flex gap-4 items-center">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari No. Invoice atau Nama Sekolah..."
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
                    <h3 className="text-lg font-medium text-foreground">Tidak ada pesanan ditemukan</h3>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map(order => {
                        const StatusIcon = STATUS_MAP[order.status]?.icon || Clock

                        return (
                            <Card key={order.id} className="overflow-hidden">
                                <div className="flex flex-col md:flex-row">
                                    <div className="bg-muted/50 p-6 md:w-64 border-r flex flex-col justify-center">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center w-fit mb-3 ${STATUS_MAP[order.status]?.color}`}>
                                            <StatusIcon className="w-3.5 h-3.5 mr-1" />
                                            {STATUS_MAP[order.status]?.label}
                                        </div>
                                        <p className="text-sm text-muted-foreground font-semibold">NO. INVOICE</p>
                                        <p className="font-bold font-mono">{order.id}</p>
                                        <p className="text-xs text-muted-foreground mt-4">{new Date(order.created_at).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>

                                    <div className="p-6 flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="font-bold text-lg mb-1">{order.tenant?.name || 'Sekolah Tidak Diketahui'}</h3>
                                            <p className="text-sm text-muted-foreground mb-4">Dikustomisasi dari: <span className="font-medium">{order.template?.name}</span></p>

                                            <div className="mb-4">
                                                <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${order.card_type === 'regular' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {order.card_type === 'regular' ? 'KARTU REGULER' : 'KARTU PINTAR (RFID)'}
                                                </span>
                                            </div>

                                            <div className="bg-slate-50 dark:bg-slate-900 rounded p-3 text-sm">
                                                <p className="font-bold border-b pb-1 mb-2">Informasi Pengiriman</p>
                                                <p><span className="text-muted-foreground">Penerima:</span> {order.shipping_info?.name}</p>
                                                <p><span className="text-muted-foreground">Telepon:</span> {order.shipping_info?.phone}</p>
                                                <p className="mt-1 line-clamp-2"><span className="text-muted-foreground">Alamat:</span> {order.shipping_info?.address}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm text-muted-foreground">Total Item</span>
                                                    <span className="font-bold">{order.items_count || order.items?.length || 0} Kartu</span>
                                                </div>
                                                <div className="flex justify-between border-b pb-2 mb-2">
                                                    <span className="text-sm text-muted-foreground">Total Tagihan</span>
                                                    <span className="font-bold text-primary">Rp {order.total_price.toLocaleString('id-ID')}</span>
                                                </div>

                                                <div className="space-y-3 mt-4">
                                                    <div>
                                                        <Label className="text-xs">Ubah Status</Label>
                                                        <Select value={order.status} onValueChange={(val) => handleStatusChange(order.id, val)}>
                                                            <SelectTrigger className="h-8 mt-1">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="pending">Menunggu Pembayaran</SelectItem>
                                                                <SelectItem value="paid">Sudah Dibayar</SelectItem>
                                                                <SelectItem value="on_progress">Sedang Dicetak</SelectItem>
                                                                <SelectItem value="shipping">Dalam Pengiriman</SelectItem>
                                                                <SelectItem value="completed">Selesai</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {(order.status === 'shipping' || order.status === 'completed' || order.shipping_receipt_number) && (
                                                        <div>
                                                            <Label className="text-xs">No. Resi Pengiriman</Label>
                                                            <div className="flex gap-2 mt-1">
                                                                <Input
                                                                    className="h-8"
                                                                    placeholder="Input Resi..."
                                                                    defaultValue={order.shipping_receipt_number || ''}
                                                                    onBlur={(e) => {
                                                                        if (e.target.value !== order.shipping_receipt_number) {
                                                                            handleReceiptChange(order.id, e.target.value)
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-end">
                                                {order.card_type === 'rfid' && (
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 focus:bg-green-700 text-white border-green-700 shadow shadow-green-600/20"
                                                        onClick={() => handleStartScan(order.id)}
                                                    >
                                                        <ScanFace className="w-4 h-4 mr-2" />
                                                        Quick Scan RFID
                                                    </Button>
                                                )}
                                                {(order.status === 'shipping' || order.status === 'completed') && (
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        className="w-full sm:w-auto bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-200"
                                                        onClick={() => window.open(`/print/shipping-label/${order.id}`, '_blank')}
                                                    >
                                                        <Printer className="w-4 h-4 mr-2" />
                                                        Cetak Resi
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full sm:w-auto relative overflow-hidden"
                                                    onClick={() => handleDownloadAssets(order.id)}
                                                    disabled={downloadingZip[order.id]}
                                                >
                                                    {downloadingZip[order.id] ? (
                                                        <>
                                                            {/* Progress bar background */}
                                                            <div
                                                                className="absolute inset-0 bg-primary/10 transition-all duration-300 pointer-events-none"
                                                                style={{
                                                                    width: `${(downloadProgress[order.id]?.current / (downloadProgress[order.id]?.total || 1)) * 100}%`
                                                                }}
                                                            />
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin relative z-10" />
                                                            <span className="relative z-10">
                                                                Merender {downloadProgress[order.id]?.current} / {downloadProgress[order.id]?.total}...
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Download className="w-4 h-4 mr-2" />
                                                            Download Aset Cetak
                                                        </>
                                                    )}
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

            {/* Modal Quick Scan RFID */}
            <Dialog open={scanModalOpen} onOpenChange={(open) => {
                setScanModalOpen(open)
                if (!open) {
                    setScanningOrder(null)
                    setScanningItems([])
                }
            }}>
                <DialogContent className="max-w-5xl md:max-w-7xl p-0 overflow-hidden bg-slate-50/50 [&>button]:hidden">
                    {scanningOrder && scanningItems.length > 0 && (
                        <div className="flex flex-col h-[95vh] max-h-[900px]">
                            {/* Header */}
                            <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
                                <div>
                                    <DialogTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
                                        <ScanFace className="w-6 h-6 md:w-8 md:h-8 text-green-400" />
                                        Quick Scan RFID Mode
                                    </DialogTitle>
                                    <p className="opacity-70 mt-1 text-sm md:text-base">Order {scanningOrder.id} • {scanningOrder.tenant?.name}</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right hidden sm:block">
                                        <div className="text-3xl font-bold font-mono text-green-400">
                                            {scanningItems.filter((i: OrderItem) => i.student?.nfc_uid).length} <span className="text-lg opacity-60 text-white">/ {scanningItems.length}</span>
                                        </div>
                                        <div className="text-xs opacity-70 mt-1 uppercase tracking-wider font-semibold">Terscan</div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => setScanModalOpen(false)}>
                                        <X className="w-6 h-6" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1 flex overflow-hidden">
                                {/* Sidebar list of students */}
                                <div className="w-1/3 min-w-[250px] max-w-[350px] bg-white border-r overflow-y-auto hidden md:block hide-scrollbar">
                                    {scanningItems.map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentScanIndex(idx)}
                                            className={`w-full text-left p-4 border-b flex items-center gap-3 transition-colors ${idx === currentScanIndex
                                                ? 'bg-blue-50 border-blue-200 relative'
                                                : 'hover:bg-slate-50'
                                                }`}
                                        >
                                            {idx === currentScanIndex && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>
                                            )}

                                            <div className="w-10 h-10 rounded-full bg-slate-100 border shrink-0 overflow-hidden flex items-center justify-center relative">
                                                <div className="text-slate-400 font-bold">{idx + 1}</div>
                                                {item.student?.nfc_uid && (
                                                    <div className="absolute bottom-0 right-0 bg-green-500 text-white rounded-full p-px shadow">
                                                        <Check className="w-2.5 h-2.5" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className={`font-semibold truncate text-sm ${idx === currentScanIndex ? 'text-blue-900' : 'text-slate-800'}`}>
                                                    {item.print_snapshot?.name || item.student?.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate font-mono">
                                                    NISN: {item.print_snapshot?.nisn || item.student?.nisn}
                                                </div>
                                            </div>

                                            {item.student?.nfc_uid && (
                                                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Main scanning area */}
                                <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-slate-50 relative">
                                    {currentScanIndex >= scanningItems.length ? (
                                        <div className="text-center animate-in fade-in zoom-in duration-500">
                                            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-green-50">
                                                <Check className="w-12 h-12" />
                                            </div>
                                            <h3 className="text-2xl font-bold mb-2">Semua Kartu Selesai Di-scan!</h3>
                                            <p className="text-muted-foreground mb-8">Anda telah menscan semua kartu pada pesanan ini.</p>
                                            <Button onClick={() => setScanModalOpen(false)} size="lg" className="px-8 shadow-lg shadow-primary/20">Selesai & Tutup</Button>
                                        </div>
                                    ) : (
                                        <div className="w-full max-w-xl flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                                            <div className="text-center mb-6">
                                                <h3 className="text-lg md:text-xl text-muted-foreground mb-2 font-medium">Ambil kartu atas nama:</h3>
                                                <div className="text-2xl md:text-4xl font-black text-slate-900 mb-1 tracking-tight">
                                                    {scanningItems[currentScanIndex]?.print_snapshot?.name || scanningItems[currentScanIndex]?.student?.name}
                                                </div>
                                                <div className="text-lg md:text-xl font-mono text-blue-600 font-semibold bg-blue-50 inline-block px-3 py-1 rounded-md mt-2 border border-blue-100">
                                                    NISN: {scanningItems[currentScanIndex]?.print_snapshot?.nisn || scanningItems[currentScanIndex]?.student?.nisn}
                                                </div>
                                            </div>

                                            <div className="w-48 h-48 md:w-56 md:h-56 rounded-3xl overflow-hidden shadow-2xl border-8 border-white bg-slate-200 mb-8 relative flex items-center justify-center">
                                                <div className="text-slate-400 font-bold text-6xl md:text-8xl">
                                                    {(scanningItems[currentScanIndex]?.print_snapshot?.name || scanningItems[currentScanIndex]?.student?.name || '?').charAt(0).toUpperCase()}
                                                </div>

                                                {scanningItems[currentScanIndex]?.student?.nfc_uid && (
                                                    <div className="absolute inset-0 bg-green-500/20 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in">
                                                        <div className="bg-white/95 text-green-600 font-bold px-4 py-2 rounded-full shadow-lg border-2 border-green-500 flex items-center gap-2">
                                                            <Check className="w-5 h-5" /> SUDAH DI-SCAN
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <form onSubmit={handleRfidSubmit} className="w-full">
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                                        {isSavingRfid ?
                                                            <Loader2 className="w-6 h-6 text-primary animate-spin" /> :
                                                            <ScanFace className="w-7 h-7 text-primary/70 group-focus-within:text-primary transition-colors" />
                                                        }
                                                    </div>
                                                    <Input
                                                        ref={rfidInputRef}
                                                        type="text"
                                                        value={rfidInput}
                                                        onChange={(e) => setRfidInput(e.target.value)}
                                                        className="w-full pl-16 pr-6 py-8 text-2xl md:text-3xl font-mono text-center rounded-2xl border-2 border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-xl transition-all"
                                                        placeholder={isSavingRfid ? "Menyimpan data..." : "Tap kartu sekarang..."}
                                                        disabled={isSavingRfid}
                                                        autoFocus
                                                    />

                                                    {/* Scanning Animation */}
                                                    <div className="absolute -inset-1 rounded-2xl bg-linear-to-r from-blue-500 via-emerald-500 to-blue-500 opacity-20 blur-xl -z-10 animate-pulse hidden group-focus-within:block"></div>
                                                </div>

                                                {scanningItems[currentScanIndex]?.student?.nfc_uid && (
                                                    <div className="mt-4 text-center text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl shadow-sm animate-in slide-in-from-top-2">
                                                        <span className="block mb-1.5 opacity-80">Kartu ini sudah memiliki UID:</span>
                                                        <span className="font-mono bg-white px-3 py-1 rounded-md border border-amber-300 font-bold text-amber-900 shadow-sm">{scanningItems[currentScanIndex].student.nfc_uid}</span>
                                                        <span className="block mt-2 opacity-70 text-xs">Tap kartu baru akan menimpa (overwrite) data lama.</span>
                                                    </div>
                                                )}

                                                <div className="text-center text-sm text-slate-500 mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 font-medium">
                                                    <span>Scanner otomatis menekan</span>
                                                    <kbd className="bg-white border border-slate-300 shadow-sm rounded-md px-3 py-1 text-xs font-mono font-bold text-slate-700">Enter</kbd>
                                                </div>
                                            </form>
                                        </div>
                                    )}

                                    {/* Navigation Controls */}
                                    <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 flex gap-3">
                                        <Button variant="secondary" size="lg" className="bg-white hover:bg-slate-100 shadow-sm text-slate-700" onClick={() => {
                                            if (currentScanIndex > 0) {
                                                setCurrentScanIndex(currentScanIndex - 1)
                                                setRfidInput("")
                                                setTimeout(() => rfidInputRef.current?.focus(), 50)
                                            }
                                        }} disabled={currentScanIndex === 0}>
                                            Sebelumnya
                                        </Button>
                                        <Button variant="secondary" size="lg" className="bg-white hover:bg-slate-100 shadow-sm text-slate-700" onClick={() => {
                                            if (currentScanIndex < scanningItems.length - 1) {
                                                setCurrentScanIndex(currentScanIndex + 1)
                                                setRfidInput("")
                                                setTimeout(() => rfidInputRef.current?.focus(), 50)
                                            }
                                        }} disabled={currentScanIndex >= scanningItems.length - 1}>
                                            Lewati <ChevronRight className="w-5 h-5 ml-1 -mr-1" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
