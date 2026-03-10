"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    UploadCloud,
    CheckCircle2,
    CreditCard,
    Truck,
    Image as ImageIcon,
    ChevronRight,
    ChevronLeft,
    AlertCircle,
    Clock,
    Maximize2
} from "lucide-react"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle
} from "@/components/ui/dialog"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"

type Template = {
    id: number
    public_id: string
    name: string
    price: number
    thumbnail_path?: string
    background_path?: string
    requires_transparent_photo?: boolean
}

type PreviewData = {
    valid: {
        photo_url?: string
        student: { name: string; nisn: string }
    }[]
    invalid: string[]
}

type OrderSuccess = {
    id: string
    status: string
    total_qty?: number
    payment_method: string
    total_price: string
}


export default function OrderKartuSiswaPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)

    // Step 1: Templates
    const [templates, setTemplates] = useState<Template[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
    const [loadingTemplates, setLoadingTemplates] = useState(true)

    // Step 2: ZIP Upload & Preview
    const [zipFile, setZipFile] = useState<File | null>(null)
    const [uploadingZip, setUploadingZip] = useState(false)
    const [previewData, setPreviewData] = useState<PreviewData>({ valid: [], invalid: [] })

    // Step 3: Checkout Form
    const [shipping, setShipping] = useState({ name: "", phone: "", address: "" })
    const [paymentMethod, setPaymentMethod] = useState("MANUAL")
    const [cardType, setCardType] = useState<"rfid" | "regular">("rfid")
    const [submittingOrder, setSubmittingOrder] = useState(false)

    // Step 4: Success
    const [orderSuccess, setOrderSuccess] = useState<OrderSuccess | null>(null)

    useEffect(() => {
        fetchTemplates()
    }, [])

    const fetchTemplates = async () => {
        try {
            const res = await api.get('/id-card-orders/templates')
            setTemplates(res.data)
        } catch {
            toast.error("Gagal memuat template")
        } finally {
            setLoadingTemplates(false)
        }
    }

    const handleZipUpload = async () => {
        if (!zipFile) {
            toast.error("Pilih file ZIP foto siswa terlebih dahulu")
            return
        }

        if (!selectedTemplate) {
            toast.error("Pilih template terlebih dahulu")
            return
        }

        try {
            setUploadingZip(true)
            const formData = new FormData()
            formData.append('zip_file', zipFile)
            formData.append('template_id', selectedTemplate.public_id)

            const res = await api.post('/id-card-orders/preview-zip', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            setPreviewData(res.data)
            setStep(3)
        } catch (unknownError: unknown) {
            const msg = (unknownError as { response?: { data?: { message?: string } } })?.response?.data?.message
            toast.error(msg || "Gagal memproses file ZIP")
        } finally {
            setUploadingZip(false)
        }
    }

    const handleCheckout = async () => {
        if (submittingOrder) return;

        if (!selectedTemplate) {
            toast.error("Pilih template terlebih dahulu")
            return
        }

        if (!shipping.name || !shipping.phone || !shipping.address) {
            toast.error("Lengkapi data pengiriman")
            return
        }

        try {
            setSubmittingOrder(true)
            const payload = {
                template_id: selectedTemplate.public_id,
                shipping_info: shipping,
                payment_method: paymentMethod,
                card_type: cardType,
                valid_items: previewData.valid // The backend already stored these temp, but we can pass confirmation
            }

            const res = await api.post('/id-card-orders', payload)

            setOrderSuccess(res.data)
            setStep(4)
        } catch (unknownError: unknown) {
            const msg = (unknownError as { response?: { data?: { message?: string } } })?.response?.data?.message
            toast.error(msg || "Gagal membuat pesanan")
        } finally {
            setSubmittingOrder(false)
        }
    }

    const handleMockPay = async () => {
        if (!orderSuccess) return;

        try {
            await api.post(`/id-card-orders/${orderSuccess.id}/pay-mock`)
            toast.success("Pembayaran berhasil disimulasikan!")
            setOrderSuccess({ ...orderSuccess, status: 'paid' })
        } catch {
            toast.error("Gagal simulasi pembayaran")
        }
    }

    const STEPS = [
        { num: 1, title: "Pilih Desain" },
        { num: 2, title: "Upload Foto" },
        { num: 3, title: "Review & Checkout" },
        { num: 4, title: "Selesai" }
    ]

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Order Kartu Siswa</h1>
                    <p className="text-muted-foreground mt-1">Pesan cetak kartu ID siswa pintar untuk sekolah Anda</p>
                </div>
                <Button variant="outline" onClick={() => router.push('/dashboard/kartu-siswa/riwayat')} className="gap-2">
                    <Clock className="w-4 h-4" />
                    Riwayat Pesanan
                </Button>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-between mb-8 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10 rounded-full"></div>
                {STEPS.map((s) => (
                    <div key={s.num} className="flex flex-col items-center gap-2 bg-background px-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step > s.num ? "bg-emerald-500 text-white" :
                            step === s.num ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                                "bg-muted text-muted-foreground"
                            }`}>
                            {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                        </div>
                        <span className={`text-xs font-medium ${step >= s.num ? "text-foreground" : "text-muted-foreground"}`}>
                            {s.title}
                        </span>
                    </div>
                ))}
            </div>

            {/* Step 1: Select Template */}
            {step === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-xl font-semibold mb-4">Pilih Desain Kartu</h2>
                    {loadingTemplates ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-xl"></div>)}
                        </div>
                    ) : (
                        <div className="px-2 md:px-12 relative">
                            <Carousel
                                opts={{ align: "start" }}
                                className="w-full"
                            >
                                <CarouselContent className="-ml-4">
                                    {templates.map((t) => (
                                        <CarouselItem key={t.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                                            <Card
                                                className={`cursor-pointer transition-all overflow-hidden relative group ${selectedTemplate?.id === t.id ? 'ring-2 ring-primary border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                                                onClick={() => setSelectedTemplate(t)}
                                            >
                                                <div className="h-48 bg-slate-100 flex items-center justify-center border-b relative">
                                                    {t.thumbnail_path || t.background_path ? (
                                                        <div
                                                            className="absolute inset-0 bg-cover bg-center"
                                                            style={{ backgroundImage: `url(${process.env.NEXT_PUBLIC_ASSET_URL}/storage/${t.thumbnail_path || t.background_path})` }}
                                                        />
                                                    ) : (
                                                        <ImageIcon className="h-10 w-10 text-muted-foreground opacity-30" />
                                                    )}

                                                    {/* Preview Button */}
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-md hover:bg-white" onClick={(e) => e.stopPropagation()}>
                                                                    <Maximize2 className="h-4 w-4 text-slate-700" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="max-w-3xl border-0 p-0 overflow-hidden bg-transparent shadow-none">
                                                                <VisuallyHidden.Root>
                                                                    <DialogTitle>Preview Desain Kartu</DialogTitle>
                                                                </VisuallyHidden.Root>
                                                                <div className="relative w-full h-[80vh] flex items-center justify-center p-4">
                                                                    {t.thumbnail_path || t.background_path ? (
                                                                        <Image
                                                                            src={`${process.env.NEXT_PUBLIC_ASSET_URL}/storage/${t.thumbnail_path || t.background_path}`}
                                                                            alt={t.name}
                                                                            width={800}
                                                                            height={500}
                                                                            className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-lg"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full bg-slate-100 flex items-center justify-center rounded-xl">
                                                                            <ImageIcon className="h-20 w-20 text-muted-foreground opacity-30" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>

                                                    {selectedTemplate?.id === t.id && (
                                                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center pointer-events-none">
                                                            <div className="bg-primary text-white rounded-full p-2 shadow-lg">
                                                                <CheckCircle2 className="w-6 h-6" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <CardContent className="p-4">
                                                    <h3 className="font-bold text-lg">{t.name}</h3>
                                                    <p className="text-primary font-semibold mt-1 mb-2">Rp {t.price.toLocaleString('id-ID')} / pcs</p>
                                                    {t.requires_transparent_photo && (
                                                        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                                            <ImageIcon className="w-3 h-3" /> Foto Transparan
                                                        </span>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious className="-left-4 lg:-left-12 h-10 w-10 bg-white" />
                                <CarouselNext className="-right-4 lg:-right-12 h-10 w-10 bg-white" />
                            </Carousel>
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <Button onClick={() => setStep(2)} disabled={!selectedTemplate} size="lg">
                            Lanjut Upload Foto
                            <ChevronRight className="ml-2 w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 2: ZIP Upload */}
            {step === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Button variant="ghost" onClick={() => setStep(1)} className="mb-4">
                        <ChevronLeft className="mr-2 w-4 h-4" /> Kembali
                    </Button>

                    <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 p-4 rounded-xl flex items-start gap-4 mb-6 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold mb-1">Instruksi Upload Foto</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Kumpulkan foto siswa dalam satu folder kosong.</li>
                                <li>Ganti nama file foto menjadi NISN masing-masing siswa (contoh: <strong>0012345678.jpg</strong>).</li>
                                <li>Kompres/zip folder tersebut menjadi satu file <strong>.zip</strong>.</li>
                                <li>Sistem akan otomatis mencocokkan foto dengan data siswa di database berdasarkan NISN.</li>
                            </ul>
                        </div>
                    </div>

                    {selectedTemplate?.requires_transparent_photo && (
                        <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 p-4 rounded-xl flex flex-col gap-2 mb-6 text-sm border border-amber-200 dark:border-amber-800/50">
                            <div className="flex items-center gap-2 font-bold text-base">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                PERHATIAN: DESAIN INI BUTUH FOTO TRANSPARAN
                            </div>
                            <p>
                                Desain kartu yang Anda pilih <strong>mewajibkan</strong> penggunaan foto siswa dengan <strong>background transparan</strong> (tanpa latar belakang warna/polos).
                                Pastikan file zip yang Anda unggah hanya berisi foto transparan/PNG untuk hasil cetak maksimal, karena foto dengan latar belakang biasa akan menutupi elemen desain kartu.
                            </p>
                        </div>
                    )}

                    <Card className="border-dashed border-2 bg-muted/20">
                        <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                            <UploadCloud className="w-16 h-16 text-muted-foreground mb-4" />
                            <h3 className="text-xl font-bold mb-2">Upload File ZIP Foto Siswa</h3>
                            <p className="text-muted-foreground mb-6 max-w-sm">Maksimal ukuran file 50MB. Pastikan format nama file foto sudah sesuai dengan NISN.</p>

                            <Input
                                type="file"
                                accept=".zip,application/zip"
                                className="max-w-xs mb-4"
                                onChange={e => setZipFile(e.target.files?.[0] || null)}
                            />

                            {zipFile && (
                                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-6 flex items-center">
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                    {zipFile.name} ({(zipFile.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                            )}

                            <Button onClick={handleZipUpload} disabled={!zipFile || uploadingZip} size="lg" className="w-full max-w-xs">
                                {uploadingZip ? "Memproses Zip..." : "Proses & Review"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Step 3: Preview & Checkout Form */}
            {step === 3 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Button variant="ghost" onClick={() => setStep(2)} className="mb-4">
                        <ChevronLeft className="mr-2 w-4 h-4" /> Kembali
                    </Button>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Sidebar Form */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card>
                                <CardContent className="p-6 space-y-4">
                                    <h3 className="font-bold text-lg flex items-center border-b pb-2">
                                        <Truck className="w-5 h-5 mr-2 text-primary" /> Pengiriman
                                    </h3>
                                    <div>
                                        <Label>Nama Penerima</Label>
                                        <Input value={shipping.name} onChange={e => setShipping({ ...shipping, name: e.target.value })} placeholder="Contoh: Budi (TU Sekolah)" className="mt-1" />
                                    </div>
                                    <div>
                                        <Label>Nomor HP / WA</Label>
                                        <Input value={shipping.phone} onChange={e => setShipping({ ...shipping, phone: e.target.value })} placeholder="08123456789" className="mt-1" />
                                    </div>
                                    <div>
                                        <Label>Alamat Lengkap</Label>
                                        <Textarea value={shipping.address} onChange={e => setShipping({ ...shipping, address: e.target.value })} placeholder="Alamat lengkap sekolah untuk pengiriman paket..." className="mt-1" rows={4} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6 space-y-4">
                                    <h3 className="font-bold text-lg flex items-center border-b pb-2">
                                        <CreditCard className="w-5 h-5 mr-2 text-primary" /> Pembayaran
                                    </h3>
                                    <div>
                                        <Label>Metode Pembayaran</Label>
                                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Pilih metode pembayaran" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MANUAL">Transfer Bank Manual</SelectItem>
                                                <SelectItem value="BCA_VA">BCA Virtual Account</SelectItem>
                                                <SelectItem value="QRIS">QRIS</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground mt-2">Biaya admin mungkin berlaku untuk beberapa metode pembayaran.</p>
                                    </div>
                                    <div className="pt-2 border-t mt-4">
                                        <Label>Jenis Kartu</Label>
                                        <Select value={cardType} onValueChange={(v: "rfid" | "regular") => setCardType(v)}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Pilih jenis kartu" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="rfid">Kartu Pintar (RFID / NFC)</SelectItem>
                                                <SelectItem value="regular">Kartu Reguler (Diskon 20%)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground mt-2">Kartu Reguler tidak memiliki chip dan tidak dikirimkan alat Scanner RFID.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content (Preview & Total) */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="font-bold text-xl mb-6">Ringkasan Pesanan</h3>

                                    <div className="bg-muted/30 p-4 rounded-xl border mb-6 flex justify-between items-center">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Desain Terpilih</p>
                                            <p className="font-bold text-lg">{selectedTemplate?.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">Harga per Cetak</p>
                                            <p className="font-bold text-lg text-primary">Rp {selectedTemplate?.price.toLocaleString('id-ID')}</p>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <h4 className="font-semibold flex items-center gap-2 mb-3">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                            Data Valid ({previewData.valid.length} Siswa)
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-2">
                                            {previewData.valid.map((item, idx) => (
                                                <div key={idx} className="border rounded bg-muted/10 p-2 text-center text-xs">
                                                    <div className="w-12 h-12 bg-slate-200 rounded-full mx-auto mb-2 overflow-hidden">
                                                        {item.photo_url ? (
                                                            <Image src={`${process.env.NEXT_PUBLIC_ASSET_URL}${item.photo_url}`} alt={item.student.name} width={100} height={100} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <ImageIcon className="w-6 h-6 m-3 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <p className="font-bold truncate" title={item.student.name}>{item.student.name}</p>
                                                    <p className="text-muted-foreground">{item.student.nisn}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {previewData.invalid.length > 0 && (
                                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900/50">
                                            <h4 className="font-semibold flex items-center gap-2 mb-2">
                                                <AlertCircle className="w-5 h-5" />
                                                Data Invalid ({previewData.invalid.length} File)
                                            </h4>
                                            <p className="text-sm mb-3">File foto ini namanya tidak cocok dengan nisn siswa manapun di database.</p>
                                            <div className="flex flex-wrap gap-2 text-xs font-mono bg-white/50 dark:bg-black/20 p-2 rounded">
                                                {previewData.invalid.map((file: string, idx) => (
                                                    <span key={idx} className="bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded">{file}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="border-t pt-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-muted-foreground">Total Cetak</span>
                                            <span className="font-bold">{previewData.valid.length} Kartu</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-muted-foreground">Total Harga</span>
                                            <div className="text-right">
                                                {cardType === 'regular' && (
                                                    <p className="text-sm line-through text-muted-foreground mb-1">
                                                        Rp {(previewData.valid.length * (selectedTemplate?.price || 0)).toLocaleString('id-ID')}
                                                    </p>
                                                )}
                                                <span className="text-3xl font-bold text-primary">
                                                    Rp {(previewData.valid.length * (selectedTemplate?.price || 0) * (cardType === 'regular' ? 0.8 : 1)).toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                        </div>

                                        <Button
                                            size="lg"
                                            className="w-full"
                                            onClick={handleCheckout}
                                            disabled={submittingOrder || previewData.valid.length === 0}
                                        >
                                            {submittingOrder ? "Memproses Pesanan..." : "Konfirmasi & Buat Pesanan"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 4: Success & Invoice */}
            {step === 4 && orderSuccess && (
                <div className="max-w-xl mx-auto text-center animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Pesanan Berhasil Dibuat!</h2>
                    <p className="text-lg text-muted-foreground mb-8">Terima kasih, pesanan kartu siswa Anda telah kami terima.</p>

                    <Card className="text-left mb-8 shadow-md border-primary/20">
                        <CardContent className="p-8">
                            <div className="flex justify-between items-start border-b pb-4 mb-4">
                                <div>
                                    <p className="text-sm text-muted-foreground font-semibold">NO. INVOICE</p>
                                    <p className="text-xl font-bold font-mono">{orderSuccess.id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground font-semibold">STATUS BAYAR</p>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase inline-flex mt-1 ${orderSuccess.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {orderSuccess.status}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Qty</span>
                                    <span className="font-semibold">{orderSuccess.total_qty || previewData.valid.length} Kartu</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Metode Pembayaran</span>
                                    <span className="font-semibold">{orderSuccess.payment_method}</span>
                                </div>
                                <div className="flex justify-between pt-3 border-t">
                                    <span className="font-bold text-lg">Total Tagihan</span>
                                    <span className="font-bold text-2xl text-primary">Rp {parseInt(orderSuccess.total_price).toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            {orderSuccess.status === 'pending' && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 text-center">
                                    <p className="text-sm font-medium mb-3">Simulasi Pembayaran (DEV MODE)</p>
                                    <Button onClick={handleMockPay} className="w-full bg-blue-600 hover:bg-blue-700">
                                        Mock &quot;Pay Now&quot; Success
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Button variant="outline" onClick={() => window.location.reload()}>Beranda Dasbor</Button>
                </div>
            )}
        </div>
    )
}
