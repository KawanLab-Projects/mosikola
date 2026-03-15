"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Save,
    ArrowLeft,
    Type,
    Image as ImageIcon,
    QrCode,
    Barcode,
    Settings,
    Shield,
    AlignLeft,
    AlignCenter,
    AlignRight
} from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Rnd } from "react-rnd"

// Define the schema for our canvas elements
type ElementKey = 'photo' | 'name' | 'nisn' | 'birth_info' | 'address' | 'jurusan' | 'qr_code' | 'barcode' | 'logo' | 'back_logo' | 'back_text' | 'school_name' | 'back_school_name' | 'back_nama_kepala_sekolah' | 'back_nip_kepala_sekolah'

interface CanvasElementProps {
    x: number;
    y: number;
    width?: number; // Only used by photo/QR
    height?: number; // Only used by photo/QR
    fontSize?: number; // Text only
    fontFamily?: string; // Text only
    fontWeight?: 'normal' | 'bold'; // Text only
    fontStyle?: 'normal' | 'italic'; // Text only
    color?: string; // Text only
    textAlign?: 'left' | 'center' | 'right'; // Text only
    shape?: 'box' | 'circle' | 'rhomb'; // Only used by photo
    borderRadius?: number; // Only used by photo box
    strokeWidth?: number; // Only used by photo
    strokeColor?: string; // Only used by photo
    text?: string; // Only used by text elements for custom text
    visible: boolean;
}

type CanvasState = Record<ElementKey, CanvasElementProps>

// Inline SVG data URLs — no network fetch needed, works inside dom-to-image canvas capture
const MOCK_PHOTO_DATA = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="#e2e8f0"/><ellipse cx="150" cy="145" rx="60" ry="65" fill="#94a3b8"/><ellipse cx="150" cy="340" rx="110" ry="90" fill="#94a3b8"/><text x="150" y="395" font-family="sans-serif" font-size="20" fill="#64748b" text-anchor="middle">Foto Siswa</text></svg>`)}`
const MOCK_LOGO_DATA = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" rx="100" fill="#f1f5f9"/><text x="100" y="125" font-family="sans-serif" font-size="60" fill="#94a3b8" text-anchor="middle" font-weight="bold">L</text></svg>`)}`

const MOCK_STUDENT = {
    photo: MOCK_PHOTO_DATA,
    logo: MOCK_LOGO_DATA,
    school_name: "SMK NEGERI 1 CONTOH",
    name: "AHMAD SYAIFUDDIN HASAN",
    nisn: "0012345678",
    birth_info: "JAKARTA, 17 AGUSTUS 2005",
    address: "JL. PEMUDA NO. 123, JAKARTA TIMUR",
    jurusan: "REKAYASA PERANGKAT LUNAK",
    back_nama_kepala_sekolah: "DRS. BUDI SANTOSO, M.PD",
    back_nip_kepala_sekolah: "NIP: 19700101 199512 1 001",
}


export default function TemplateEditorPage() {
    const params = useParams()
    const router = useRouter()
    const templateId = params.public_id as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [templateName, setTemplateName] = useState("")
    const [price, setPrice] = useState(0)
    const [isActive, setIsActive] = useState(false)
    const [requiresTransparentPhoto, setRequiresTransparentPhoto] = useState(false)
    const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null)
    const [backBackgroundUrl, setBackBackgroundUrl] = useState<string | null>(null)
    const [selectedElement, setSelectedElement] = useState<ElementKey | null>(null)
    const [layout, setLayout] = useState<'portrait' | 'landscape'>('portrait')
    const [activeSide, setActiveSide] = useState<'front' | 'back'>('front')
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)

    const [canvasState, setCanvasState] = useState<CanvasState>({
        photo: { x: 50, y: 50, width: 100, height: 120, shape: 'box', borderRadius: 0, visible: true },
        logo: { x: 20, y: 20, width: 50, height: 50, shape: 'circle', visible: true },
        school_name: { x: 100, y: 30, fontSize: 16, fontFamily: 'Arial', fontWeight: 'bold', fontStyle: 'normal', color: '#000000', visible: true },
        name: { x: 200, y: 50, fontSize: 18, fontFamily: 'Arial', fontWeight: 'bold', fontStyle: 'normal', color: '#000000', visible: true },
        nisn: { x: 200, y: 80, fontSize: 14, fontFamily: 'Arial', fontWeight: 'normal', fontStyle: 'normal', color: '#333333', visible: true },
        birth_info: { x: 200, y: 110, fontSize: 12, fontFamily: 'Arial', fontWeight: 'normal', fontStyle: 'normal', color: '#555555', visible: true },
        address: { x: 200, y: 130, fontSize: 12, fontFamily: 'Arial', fontWeight: 'normal', fontStyle: 'normal', color: '#555555', visible: true },
        jurusan: { x: 200, y: 150, fontSize: 12, fontFamily: 'Arial', fontWeight: 'normal', fontStyle: 'normal', color: '#555555', visible: true },
        qr_code: { x: 300, y: 200, width: 80, height: 80, visible: true },
        barcode: { x: 200, y: 200, width: 120, height: 40, visible: false },
        back_logo: { x: 150, y: 50, width: 100, height: 100, shape: 'circle', visible: true },
        back_school_name: { x: 100, y: 160, fontSize: 16, fontFamily: 'Arial', fontWeight: 'bold', fontStyle: 'normal', color: '#000000', visible: true },
        back_text: { x: 50, y: 200, fontSize: 12, fontFamily: 'Arial', fontWeight: 'normal', fontStyle: 'normal', color: '#000000', text: "Ketentuan Kartu:\n1. Kartu ini adalah milik Sekolah\n2. Harap dibawa setiap hari.", visible: true },
        back_nama_kepala_sekolah: { x: 150, y: 320, fontSize: 14, fontFamily: 'Arial', fontWeight: 'bold', fontStyle: 'normal', color: '#000000', visible: true },
        back_nip_kepala_sekolah: { x: 150, y: 340, fontSize: 12, fontFamily: 'Arial', fontWeight: 'normal', fontStyle: 'normal', color: '#000000', visible: true },
    })

    // Fixed canvas size for ID cards (Standard CR80: ~1012x638 px for high res or we use a scaled logical size)
    // We'll use a standard Portrait 400x600 for editing, flipped for landscape
    const CANVAS_WIDTH = layout === 'portrait' ? 400 : 600
    const CANVAS_HEIGHT = layout === 'portrait' ? 600 : 400

    const getElementLabel = (key: ElementKey): string => {
        const labels: Record<string, string> = {
            photo: 'Foto Siswa',
            name: 'Nama Siswa',
            nisn: 'NISN',
            birth_info: 'Tempat, Tgl Lahir',
            address: 'Alamat',
            jurusan: 'Jurusan / Kompetensi',
            qr_code: 'QR Code',
            barcode: 'Barcode',
            logo: 'Logo Depan',
            school_name: 'Nama Sekolah (Depan)',
            back_logo: 'Logo Belakang',
            back_school_name: 'Nama Sekolah (Belakang)',
            back_text: 'Teks Belakang (Ketentuan)',
            back_nama_kepala_sekolah: 'Nama Kepala Sekolah',
            back_nip_kepala_sekolah: 'NIP Kepala Sekolah'
        };
        return labels[key] || key.replace('_', ' ');
    };

    /**
     * Smart text fitter: Abbreviates middle/last words if text overflows.
     * Falls back to scaleX squishing if still too long.
     */
    const getAutoFitTextAndTransform = (originalText: string, boxWidth: number, fontSize: number, allowAbbreviation: boolean = true): { text: string, transform: string } => {
        if (!originalText || !boxWidth || !fontSize) return { text: originalText, transform: 'none' };

        const avgCharWidth = fontSize * 0.58;

        // 1. Try original text
        let estimatedWidth = originalText.length * avgCharWidth;
        if (estimatedWidth <= boxWidth) {
            return { text: originalText, transform: 'none' };
        }

        let abbreviatedText = originalText;
        let scaleFactor = 1;

        // 2. Abbreviation Logic (shorten middle/last words) - only if allowed
        // 2. Abbreviation Logic (shorten middle words first, then last name) - only if allowed
        if (allowAbbreviation) {
            const words = originalText.trim().split(/\s+/);
            if (words.length > 2) {
                const candidateWords = [...words];
                // First pass: abbreviate middle names left-to-right
                for (let i = 1; i < candidateWords.length - 1; i++) {
                    if (candidateWords[i].length > 1) {
                        candidateWords[i] = candidateWords[i].charAt(0) + ".";
                    }
                    const candidateText = candidateWords.join(" ");
                    if (candidateText.length * avgCharWidth <= boxWidth) {
                        abbreviatedText = candidateText;
                        break;
                    }
                    abbreviatedText = candidateText;
                }

                // If it STILL doesn't fit after all middle names are abbreviated, abbreviate the last name too
                if (abbreviatedText.length * avgCharWidth > boxWidth) {
                    const lastIdx = candidateWords.length - 1;
                    if (candidateWords[lastIdx].length > 1) {
                        candidateWords[lastIdx] = candidateWords[lastIdx].charAt(0) + ".";
                    }
                    abbreviatedText = candidateWords.join(" ");
                }
            } else if (words.length === 2 && words[1].length > 1) {
                // For 2 words, abbreviate the second word
                const candidateText = words[0] + " " + words[1].charAt(0) + ".";
                abbreviatedText = candidateText;
            }
        }

        // 3. Final Squish Check (if abbreviated/original text STILL overflows)
        estimatedWidth = abbreviatedText.length * avgCharWidth;
        if (estimatedWidth > boxWidth) {
            scaleFactor = Math.max(0.6, boxWidth / estimatedWidth);
            return { text: abbreviatedText, transform: `scaleX(${scaleFactor})` };
        }

        return { text: abbreviatedText, transform: 'none' };
    };

    const fetchTemplate = useCallback(async () => {
        try {
            setLoading(true)
            const res = await api.get(`/superadmin/id-card-templates/${templateId}`)
            const data = res.data

            setTemplateName(data.name)
            setPrice(data.price)
            setIsActive(data.is_active)
            setRequiresTransparentPhoto(data.requires_transparent_photo || false)
            if (data.background_url) {
                setBackgroundUrl(data.background_url)
            }
            if (data.back_background_url) {
                setBackBackgroundUrl(data.back_background_url)
            }
            if (data.thumbnail_url) {
                setThumbnailUrl(data.thumbnail_url)
            }
            if (data.canvas_state) {
                if (data.canvas_state.elements) {
                    setCanvasState(prev => ({ ...prev, ...data.canvas_state.elements }))
                    setLayout(data.canvas_state.layout || 'portrait')
                } else {
                    setCanvasState(prev => ({ ...prev, ...data.canvas_state }))
                    setLayout('portrait')
                }
            }
        } catch {
            toast.error("Gagal memuat detail template")
            router.push('/dashboard/superadmin/kartu-siswa/templates')
        } finally {
            setLoading(false)
        }
    }, [router, templateId])

    useEffect(() => {
        fetchTemplate()
    }, [fetchTemplate])

    const handleSave = async () => {
        try {
            setSaving(true)
            await api.put(`/superadmin/id-card-templates/${templateId}`, {
                name: templateName,
                price: price,
                is_active: isActive,
                requires_transparent_photo: requiresTransparentPhoto,
                canvas_state: {
                    layout: layout,
                    elements: canvasState
                }
            })
            toast.success("Template berhasil disimpan")
        } catch {
            toast.error("Gagal menyimpan template")
        } finally {
            setSaving(false)
        }
    }

    const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            toast.error("File terlalu besar (Maks 2MB)")
            return
        }

        try {
            const formData = new FormData()
            const inputField = activeSide === 'front' ? 'background_image' : 'back_background_image'
            formData.append(inputField, file)

            const sideLabel = activeSide === 'front' ? 'Depan' : 'Belakang'
            toast.loading(`Mengunggah background ${sideLabel}...`, { id: 'upload' })

            const res = await api.post(`/superadmin/id-card-templates/${templateId}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            if (activeSide === 'front') {
                setBackgroundUrl(res.data.background_url)
            } else {
                setBackBackgroundUrl(res.data.back_background_url)
            }

            toast.success(`Background ${sideLabel} diperbarui`, { id: 'upload' })
        } catch {
            toast.error("Gagal mengunggah background", { id: 'upload' })
        }
    }

    const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 2 * 1024 * 1024) {
            toast.error("File terlalu besar (Maks 2MB)")
            return
        }
        try {
            const formData = new FormData()
            formData.append('thumbnail_image', file)
            const res = await api.post(`/superadmin/id-card-templates/${templateId}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            if (res.data.thumbnail_url) {
                setThumbnailUrl(res.data.thumbnail_url)
            }
            toast.success("Thumbnail berhasil diunggah")
        } catch {
            toast.error("Gagal mengunggah thumbnail")
        }
    }

    const updateElement = (key: ElementKey, updates: Partial<CanvasElementProps>) => {
        setCanvasState(prev => ({
            ...prev,
            [key]: { ...prev[key], ...updates }
        }))
    }

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedElement) return;

            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                // Don't move element if user is typing in an input or textarea
                if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
                    return;
                }

                e.preventDefault();
                const step = e.shiftKey ? 10 : 1;

                setCanvasState(prev => {
                    const el = prev[selectedElement];
                    if (!el) return prev;

                    let newX = el.x;
                    let newY = el.y;

                    switch (e.key) {
                        case 'ArrowUp': newY -= step; break;
                        case 'ArrowDown': newY += step; break;
                        case 'ArrowLeft': newX -= step; break;
                        case 'ArrowRight': newX += step; break;
                    }

                    return {
                        ...prev,
                        [selectedElement]: {
                            ...el,
                            x: newX,
                            y: newY
                        }
                    };
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedElement, canvasState]);

    if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

    // Render configuration sidebar
    const renderSidebar = () => {
        const el = selectedElement ? canvasState[selectedElement] : null;

        return (
            <div className="w-80 bg-card border rounded-xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-8rem)]">
                <div className="p-4 border-b bg-muted/30">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Pengaturan Template
                    </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* General Settings */}
                    <div className="space-y-4">
                        <div>
                            <Label>Nama Template</Label>
                            <Input value={templateName} onChange={e => setTemplateName(e.target.value)} className="mt-1" />
                        </div>
                        <div>
                            <Label>Harga Cetak (Rp)</Label>
                            <Input type="number" min="0" value={price} onChange={e => setPrice(parseInt(e.target.value) || 0)} className="mt-1" />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label className="cursor-pointer" htmlFor="status">Tersedia untuk Admin?</Label>
                            <Switch id="status" checked={isActive} onCheckedChange={setIsActive} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label className="cursor-pointer" htmlFor="transparent-photo">Butuh Foto Transparan?</Label>
                            <Switch id="transparent-photo" checked={requiresTransparentPhoto} onCheckedChange={setRequiresTransparentPhoto} />
                        </div>
                        <div>
                            <Label>Layout Kartu</Label>
                            <Select value={layout} onValueChange={(val: 'portrait' | 'landscape') => setLayout(val)}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Pilih layout" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="portrait">Potrait (Berdiri)</SelectItem>
                                    <SelectItem value="landscape">Landscape (Mendatar)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Background {activeSide === 'front' ? 'Sisi Depan' : 'Sisi Belakang'}</Label>
                            <div className="mt-1 flex items-center gap-2">
                                <Input type="file" key={`bg-${activeSide}`} accept="image/png, image/jpeg" className="text-xs" onChange={handleBackgroundUpload} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Rekomendasi: {layout === 'portrait' ? '638x1012 px' : '1012x638 px'}</p>
                        </div>
                        <div>
                            <Label>Thumbnail Galeri</Label>
                            <div className="mt-1 flex flex-col gap-2">
                                {thumbnailUrl && (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-28 object-contain rounded border bg-muted" />
                                )}
                                <Input type="file" accept="image/png, image/jpeg" className="text-xs" onChange={handleThumbnailUpload} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Screenshot desain kartu dan upload di sini.</p>
                        </div>
                    </div>

                    {/* Front / Back Toggle */}
                    <div className="flex bg-muted/50 p-1 rounded-md mb-4 border">
                        <button
                            className={`flex-1 py-1 text-sm font-medium rounded transition-colors ${activeSide === 'front' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-800'}`}
                            onClick={() => { setActiveSide('front'); setSelectedElement(null); }}
                        >
                            Sisi Depan
                        </button>
                        <button
                            className={`flex-1 py-1 text-sm font-medium rounded transition-colors ${activeSide === 'back' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-800'}`}
                            onClick={() => { setActiveSide('back'); setSelectedElement(null); }}
                        >
                            Sisi Belakang
                        </button>
                    </div>

                    <div className="border-t pt-4">
                        <Label className="mb-2 block text-muted-foreground font-semibold uppercase text-xs">Visibilitas Elemen ({activeSide === 'front' ? 'Depan' : 'Belakang'})</Label>
                        <div className="space-y-2">
                            {(Object.keys(canvasState) as ElementKey[])
                                .filter(key => activeSide === 'front' ? !key.startsWith('back_') : key.startsWith('back_'))
                                .map(key => (
                                    <div key={key} className="flex items-center justify-between text-sm hover:bg-muted/50 p-1.5 rounded-md -mx-1.5 px-2 cursor-pointer transition-colors"
                                        onClick={() => setSelectedElement(key)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {key.includes('logo') || key === 'photo' ? <ImageIcon className="w-3.5 h-3.5" /> :
                                                key === 'qr_code' ? <QrCode className="w-3.5 h-3.5" /> :
                                                    key === 'barcode' ? <Barcode className="w-3.5 h-3.5" /> :
                                                        <Type className="w-3.5 h-3.5" />}
                                            <span className={`capitalize ${selectedElement === key ? 'font-bold text-primary' : ''}`}>
                                                {getElementLabel(key)}
                                            </span>
                                        </div>
                                        <Switch
                                            checked={canvasState[key].visible}
                                            onCheckedChange={(c) => updateElement(key, { visible: c })}
                                            onClick={e => e.stopPropagation()}
                                        />
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Selected Element Settings */}
                    {selectedElement && el && (
                        <div className="border-t pt-4 animate-in fade-in zoom-in-95 duration-200">
                            <Label className="mb-4 block text-primary font-bold uppercase text-xs bg-primary/10 p-2 rounded">Edit: {selectedElement.replace('_', ' ')}</Label>

                            <div className="space-y-4">
                                {('fontSize' in el) && (
                                    <>
                                        <div>
                                            <Label>Font Family</Label>
                                            <Select value={el.fontFamily || 'Arial'} onValueChange={(val: string) => updateElement(selectedElement, { fontFamily: val })}>
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Pilih Font" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Arial">Arial</SelectItem>
                                                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                                                    <SelectItem value="Courier New">Courier New</SelectItem>
                                                    <SelectItem value="Verdana">Verdana</SelectItem>
                                                    <SelectItem value="Georgia">Georgia</SelectItem>
                                                    <SelectItem value="Roboto">Roboto</SelectItem>
                                                    <SelectItem value="Lato">Lato</SelectItem>
                                                    <SelectItem value="Montserrat">Montserrat</SelectItem>
                                                    <SelectItem value="Futura">Futura</SelectItem>
                                                    <SelectItem value="Proxima Nova">Proxima Nova</SelectItem>
                                                    <SelectItem value="Poppins">Poppins</SelectItem>
                                                    <SelectItem value="Nunito">Nunito</SelectItem>
                                                    <SelectItem value="Raleway">Raleway</SelectItem>
                                                    <SelectItem value="sans-serif">Sans-serif Default</SelectItem>
                                                    <SelectItem value="serif">Serif Default</SelectItem>
                                                    <SelectItem value="monospace">Monospace</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label>Ketebalan</Label>
                                                <Select value={el.fontWeight || 'normal'} onValueChange={(val: 'normal' | 'bold') => updateElement(selectedElement, { fontWeight: val })}>
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Normal/Bold" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="normal">Normal</SelectItem>
                                                        <SelectItem value="bold">Bold</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label>Gaya</Label>
                                                <Select value={el.fontStyle || 'normal'} onValueChange={(val: 'normal' | 'italic') => updateElement(selectedElement, { fontStyle: val })}>
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Gaya Teks" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="normal">Normal</SelectItem>
                                                        <SelectItem value="italic">Italic</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label>Ukuran Font (px)</Label>
                                                <Input type="number" value={el.fontSize || 16} onChange={e => updateElement(selectedElement, { fontSize: parseInt(e.target.value) || 16 })} className="mt-1" />
                                            </div>
                                            <div>
                                                <Label>Warna Teks</Label>
                                                <div className="flex mt-1 gap-2">
                                                    <Input type="color" value={el.color || '#000000'} onChange={e => updateElement(selectedElement, { color: e.target.value })} className="w-8 p-1 px-0 border-0" />
                                                    <Input type="text" value={el.color || '#000000'} onChange={e => updateElement(selectedElement, { color: e.target.value })} className="flex-1" />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Perataan Teks</Label>
                                            <div className="flex mt-1 p-1 bg-muted rounded-md w-fit">
                                                <Button
                                                    variant={el.textAlign === 'left' || !el.textAlign ? 'secondary' : 'ghost'}
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => updateElement(selectedElement, { textAlign: 'left' })}
                                                >
                                                    <AlignLeft className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant={el.textAlign === 'center' ? 'secondary' : 'ghost'}
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => updateElement(selectedElement, { textAlign: 'center' })}
                                                >
                                                    <AlignCenter className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant={el.textAlign === 'right' ? 'secondary' : 'ghost'}
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => updateElement(selectedElement, { textAlign: 'right' })}
                                                >
                                                    <AlignRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {('width' in el) && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label>Lebar (px)</Label>
                                            <Input type="number" value={el.width || 100} onChange={e => updateElement(selectedElement, { width: parseInt(e.target.value) || 100 })} className="mt-1" />
                                        </div>
                                        <div>
                                            <Label>Tinggi (px)</Label>
                                            <Input type="number" value={el.height || 100} onChange={e => updateElement(selectedElement, { height: parseInt(e.target.value) || 100 })} className="mt-1" />
                                        </div>
                                    </div>
                                )}

                                {selectedElement === 'photo' && (
                                    <div>
                                        <Label>Bentuk Foto</Label>
                                        <Select
                                            value={el.shape || 'box'}
                                            onValueChange={(val: 'box' | 'circle' | 'rhomb') => updateElement('photo', { shape: val })}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Pilih bentuk" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="box">Kotak</SelectItem>
                                                <SelectItem value="circle">Lingkaran</SelectItem>
                                                <SelectItem value="rhomb">Belah Ketupat (Rhombus)</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {['box', 'rhomb'].includes(el.shape || 'box') && (
                                            <div className="mt-4">
                                                <Label>Sudut Melengkung (Border Radius) px</Label>
                                                <Input
                                                    type="number"
                                                    value={el.borderRadius || 0}
                                                    onChange={e => updateElement('photo', { borderRadius: parseInt(e.target.value) || 0 })}
                                                    className="mt-1"
                                                    min="0"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {('text' in el || selectedElement === 'back_text' || selectedElement?.includes('text')) && (
                                    <div className="mt-4">
                                        <Label>Isi Teks Custom</Label>
                                        <textarea
                                            value={el.text || ''}
                                            onChange={e => updateElement(selectedElement, { text: e.target.value })}
                                            className="w-full mt-1 min-h-[80px] p-2 text-sm border rounded-md custom-scrollbar bg-background"
                                            placeholder="Masukkan teks di sini..."
                                        />
                                    </div>
                                )}

                                {selectedElement === 'logo' && (
                                    <div>
                                        <Label>Bentuk Logo</Label>
                                        <Select
                                            value={el.shape || 'box'}
                                            onValueChange={(val: 'box' | 'circle') => updateElement('logo', { shape: val })}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Pilih bentuk" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="box">Kotak</SelectItem>
                                                <SelectItem value="circle">Lingkaran</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {el.shape === 'box' && (
                                            <div className="mt-4">
                                                <Label>Sudut Melengkung (Border Radius) px</Label>
                                                <Input
                                                    type="number"
                                                    value={el.borderRadius || 0}
                                                    onChange={e => updateElement('logo', { borderRadius: parseInt(e.target.value) || 0 })}
                                                    className="mt-1"
                                                    min="0"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-muted/30">
                    <Button onClick={handleSave} disabled={saving} className="w-full">
                        {saving ? "Menyimpan..." : <><Save className="w-4 h-4 mr-2" /> Simpan Perubahan</>}
                    </Button>
                </div>
            </div >
        )
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/superadmin/kartu-siswa/templates')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-xl font-bold">Desain Template: {templateName}</h1>
                    <p className="text-sm text-muted-foreground">Geser elemen ke posisi yang diinginkan di atas kanvas.</p>
                </div>
            </div>

            <div className="flex flex-1 gap-6 items-start justify-center">
                {/* Canvas Area */}
                <div
                    className="relative bg-white shadow-xl border rounded overflow-hidden shrink-0"
                    style={{
                        width: CANVAS_WIDTH,
                        height: CANVAS_HEIGHT,
                        backgroundImage: activeSide === 'front'
                            ? (backgroundUrl ? `url(${backgroundUrl})` : 'none')
                            : (backBackgroundUrl ? `url(${backBackgroundUrl})` : 'none'),
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                    onClick={() => setSelectedElement(null)} // deselect
                >
                    {!(activeSide === 'front' ? backgroundUrl : backBackgroundUrl) && (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 font-bold text-2xl rotate-45 select-none pointer-events-none">
                            NO BACKGROUND
                        </div>
                    )}

                    {/* --- FRONT SIDE ELEMENTS --- */}
                    {activeSide === 'front' && (
                        <>

                            {/* PHOTO */}
                            {canvasState.photo.visible && (
                                <Rnd
                                    size={{ width: canvasState.photo.width || 100, height: canvasState.photo.height || 120 }}
                                    position={{ x: canvasState.photo.x, y: canvasState.photo.y }}
                                    onDragStop={(e, d) => updateElement('photo', { x: d.x, y: d.y })}
                                    onResizeStop={(e, dir, ref, delta, position) => {
                                        updateElement('photo', {
                                            width: parseInt(ref.style.width, 10),
                                            height: parseInt(ref.style.height, 10),
                                            ...position
                                        });
                                    }}
                                    bounds="parent"
                                    onClick={(e: React.MouseEvent | React.TouchEvent) => { e.stopPropagation(); setSelectedElement('photo'); }}
                                    className={`border-2 ${selectedElement === 'photo' ? 'border-primary ring-2 ring-primary/30 z-50' : 'border-dashed border-transparent hover:border-gray-400'} flex items-center justify-center cursor-move transition-colors overflow-hidden`}
                                    style={{
                                        borderRadius: canvasState.photo.shape === 'circle' ? '50%' : canvasState.photo.shape === 'box' ? `${canvasState.photo.borderRadius || 0}px` : '0',
                                    }}
                                >
                                    {canvasState.photo.shape === 'rhomb' ? (
                                        <div className="w-full h-full flex items-center justify-center overflow-hidden">
                                            <div
                                                style={{
                                                    width: '70.71%',
                                                    height: '70.71%',
                                                    transform: 'rotate(45deg)',
                                                    borderRadius: `${canvasState.photo.borderRadius || 0}px`,
                                                    overflow: 'hidden',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                                className="bg-slate-200 dark:bg-slate-800"
                                            >
                                                <img
                                                    src={MOCK_STUDENT.photo}
                                                    alt="Photo Area"
                                                    style={{
                                                        width: '141.42%',
                                                        height: '141.42%',
                                                        objectFit: 'cover',
                                                        transform: 'rotate(-45deg)',
                                                        pointerEvents: 'none',
                                                        opacity: 0.8
                                                    }}
                                                    draggable={false}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={MOCK_STUDENT.photo}
                                            alt="Photo Area"
                                            className="w-full h-full object-cover pointer-events-none opacity-80"
                                            draggable={false}
                                        />
                                    )}
                                </Rnd>
                            )}

                            {/* LOGO */}
                            {canvasState.logo.visible && (
                                <Rnd
                                    size={{ width: canvasState.logo.width || 50, height: canvasState.logo.height || 50 }}
                                    position={{ x: canvasState.logo.x, y: canvasState.logo.y }}
                                    onDragStop={(e, d) => updateElement('logo', { x: d.x, y: d.y })}
                                    onResizeStop={(e, dir, ref, delta, position) => {
                                        updateElement('logo', {
                                            width: parseInt(ref.style.width, 10),
                                            height: parseInt(ref.style.height, 10),
                                            ...position
                                        });
                                    }}
                                    bounds="parent"
                                    onClick={(e: React.MouseEvent | React.TouchEvent) => { e.stopPropagation(); setSelectedElement('logo'); }}
                                    className={`border-2 ${selectedElement === 'logo' ? 'border-primary ring-2 ring-primary/30 z-50' : 'border-dashed border-transparent hover:border-gray-400'} flex items-center justify-center cursor-move transition-colors overflow-hidden`}
                                    style={{
                                        borderRadius: canvasState.logo.shape === 'circle' ? '50%' : canvasState.logo.shape === 'box' ? `${canvasState.logo.borderRadius || 0}px` : '0',
                                    }}
                                >
                                    <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                        <Shield className="w-1/2 h-1/2" />
                                    </div>
                                </Rnd>
                            )}

                            {/* QR CODE */}
                            {canvasState.qr_code.visible && (
                                <Rnd
                                    size={{ width: canvasState.qr_code.width || 80, height: canvasState.qr_code.height || 80 }}
                                    position={{ x: canvasState.qr_code.x, y: canvasState.qr_code.y }}
                                    onDragStop={(e, d) => updateElement('qr_code', { x: d.x, y: d.y })}
                                    onResizeStop={(e, dir, ref, delta, position) => {
                                        updateElement('qr_code', {
                                            width: parseInt(ref.style.width, 10),
                                            height: parseInt(ref.style.height, 10),
                                            ...position
                                        });
                                    }}
                                    bounds="parent"
                                    onClick={(e: React.MouseEvent | React.TouchEvent) => { e.stopPropagation(); setSelectedElement('qr_code'); }}
                                    className={`border-2 ${selectedElement === 'qr_code' ? 'border-primary ring-2 ring-primary/30 z-50' : 'border-dashed border-gray-400 hover:border-gray-500'} bg-white flex items-center justify-center cursor-move transition-colors`}
                                >
                                    <QrCode className="w-full h-full p-2 text-foreground/80 pointer-events-none" />
                                </Rnd>
                            )}

                            {/* BARCODE */}
                            {canvasState.barcode?.visible && (
                                <Rnd
                                    size={{ width: canvasState.barcode.width || 120, height: canvasState.barcode.height || 40 }}
                                    position={{ x: canvasState.barcode.x, y: canvasState.barcode.y }}
                                    onDragStop={(e, d) => updateElement('barcode', { x: d.x, y: d.y })}
                                    onResizeStop={(e, dir, ref, delta, position) => {
                                        updateElement('barcode', {
                                            width: parseInt(ref.style.width, 10),
                                            height: parseInt(ref.style.height, 10),
                                            ...position
                                        });
                                    }}
                                    bounds="parent"
                                    onClick={(e: React.MouseEvent | React.TouchEvent) => { e.stopPropagation(); setSelectedElement('barcode'); }}
                                    className={`border-2 ${selectedElement === 'barcode' ? 'border-primary ring-2 ring-primary/30 z-50' : 'border-dashed border-gray-400 hover:border-gray-500'} bg-white flex items-center justify-center cursor-move transition-colors`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=0012345678&scale=2&includetext=false`}
                                        alt="Barcode Preview"
                                        className="w-full h-full object-fill pointer-events-none opacity-80"
                                        draggable={false}
                                    />
                                </Rnd>
                            )}

                            {/* TEXT: SCHOOL NAME */}
                            {canvasState.school_name?.visible && (
                                <Rnd
                                    size={{ width: canvasState.school_name.width || 'auto', height: canvasState.school_name.height || 'auto' }}
                                    position={{ x: canvasState.school_name.x, y: canvasState.school_name.y }}
                                    onDragStop={(e, d) => updateElement('school_name', { x: d.x, y: d.y })}
                                    onResizeStop={(e, dir, ref, delta, position) => {
                                        updateElement('school_name', { width: parseInt(ref.style.width, 10), ...position });
                                    }}
                                    enableResizing={{ top: false, right: true, bottom: false, left: false, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false }}
                                    bounds="parent"
                                    onClick={(e: React.MouseEvent | React.TouchEvent) => { e.stopPropagation(); setSelectedElement('school_name'); }}
                                    className={`cursor-move px-1 border-2 ${selectedElement === 'school_name' ? 'border-primary ring-2 ring-primary/30 bg-primary/10 z-50' : 'border-transparent hover:border-dashed hover:border-gray-400'} flex items-center whitespace-nowrap`}
                                    style={{
                                        fontSize: `${canvasState.school_name.fontSize}px`,
                                        color: canvasState.school_name.color,
                                        fontFamily: canvasState.school_name.fontFamily,
                                        fontWeight: canvasState.school_name.fontWeight === 'bold' ? 'bold' : 'normal',
                                        fontStyle: canvasState.school_name.fontStyle === 'italic' ? 'italic' : 'normal',
                                    }}
                                >
                                    {(() => {
                                        const originalText = canvasState.school_name.text || MOCK_STUDENT.school_name;
                                        // Pass 'false' to allowAbbreviation to strictly squish school names instead of abbreviating
                                        const { text: fittedText, transform } = getAutoFitTextAndTransform(originalText, (canvasState.school_name.width || 100) - 12, canvasState.school_name.fontSize || 16, false);
                                        return (
                                            <div style={{
                                                textAlign: canvasState.school_name.textAlign || 'left',
                                                transformOrigin: canvasState.school_name.textAlign === 'center' ? 'center center' : canvasState.school_name.textAlign === 'right' ? 'right center' : 'left center',
                                                transform: transform,
                                                width: '100%',
                                            }}>
                                                {fittedText}
                                            </div>
                                        );
                                    })()}
                                </Rnd>
                            )}

                            {/* TEXT: NAME */}
                            {canvasState.name.visible && (
                                <Rnd
                                    size={{ width: canvasState.name.width || 'auto', height: canvasState.name.height || 'auto' }}
                                    position={{ x: canvasState.name.x, y: canvasState.name.y }}
                                    onDragStop={(e, d) => updateElement('name', { x: d.x, y: d.y })}
                                    onResizeStop={(e, dir, ref, delta, position) => {
                                        updateElement('name', { width: parseInt(ref.style.width, 10), ...position });
                                    }}
                                    enableResizing={{ top: false, right: true, bottom: false, left: false, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false }}
                                    bounds="parent"
                                    onClick={(e: React.MouseEvent | React.TouchEvent) => { e.stopPropagation(); setSelectedElement('name'); }}
                                    className={`cursor-move uppercase px-1 border-2 ${selectedElement === 'name' ? 'border-primary ring-2 ring-primary/30 bg-primary/10 z-50' : 'border-transparent hover:border-dashed hover:border-gray-400'} flex items-center whitespace-nowrap`}
                                    style={{
                                        fontSize: `${canvasState.name.fontSize}px`,
                                        color: canvasState.name.color,
                                        fontFamily: canvasState.name.fontFamily,
                                        fontWeight: canvasState.name.fontWeight === 'bold' ? 'bold' : 'normal',
                                        fontStyle: canvasState.name.fontStyle === 'italic' ? 'italic' : 'normal',
                                    }}
                                >
                                    {(() => {
                                        const originalText = MOCK_STUDENT.name;
                                        const { text: fittedText, transform } = getAutoFitTextAndTransform(originalText, (canvasState.name.width || 100) - 12, canvasState.name.fontSize || 18);
                                        return (
                                            <div style={{
                                                textAlign: canvasState.name.textAlign || 'left',
                                                transformOrigin: canvasState.name.textAlign === 'center' ? 'center center' : canvasState.name.textAlign === 'right' ? 'right center' : 'left center',
                                                transform: transform,
                                                width: '100%',
                                            }}>
                                                {fittedText}
                                            </div>
                                        );
                                    })()}
                                </Rnd>
                            )}

                            {/* TEXT: NISN */}
                            {canvasState.nisn.visible && (
                                <Rnd
                                    size={{ width: canvasState.nisn.width || 'auto', height: canvasState.nisn.height || 'auto' }}
                                    position={{ x: canvasState.nisn.x, y: canvasState.nisn.y }}
                                    onDragStop={(e, d) => updateElement('nisn', { x: d.x, y: d.y })}
                                    onResizeStop={(e, dir, ref, delta, position) => {
                                        updateElement('nisn', { width: parseInt(ref.style.width, 10), ...position });
                                    }}
                                    enableResizing={{ top: false, right: true, bottom: false, left: false, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false }}
                                    bounds="parent"
                                    onClick={(e: React.MouseEvent | React.TouchEvent) => { e.stopPropagation(); setSelectedElement('nisn'); }}
                                    className={`cursor-move px-1 border-2 ${selectedElement === 'nisn' ? 'border-primary ring-2 ring-primary/30 bg-primary/10 z-50' : 'border-transparent hover:border-dashed hover:border-gray-400'} flex items-center whitespace-nowrap`}
                                    style={{
                                        fontSize: `${canvasState.nisn.fontSize}px`,
                                        color: canvasState.nisn.color,
                                        fontFamily: canvasState.nisn.fontFamily,
                                        fontWeight: canvasState.nisn.fontWeight === 'bold' ? 'bold' : 'normal',
                                        fontStyle: canvasState.nisn.fontStyle === 'italic' ? 'italic' : 'normal',
                                    }}
                                >
                                    {(() => {
                                        const originalText = MOCK_STUDENT.nisn;
                                        const { text: fittedText, transform } = getAutoFitTextAndTransform(originalText, (canvasState.nisn.width || 100) - 12, canvasState.nisn.fontSize || 14);
                                        return (
                                            <div style={{
                                                textAlign: canvasState.nisn.textAlign || 'left',
                                                transformOrigin: canvasState.nisn.textAlign === 'center' ? 'center center' : canvasState.nisn.textAlign === 'right' ? 'right center' : 'left center',
                                                transform: transform,
                                                width: '100%',
                                            }}>
                                                {fittedText}
                                            </div>
                                        );
                                    })()}
                                </Rnd>
                            )}

                            {/* TEXT: BIRTH INFO */}
                            {canvasState.birth_info.visible && (
                                <Rnd
                                    size={{ width: canvasState.birth_info.width || 'auto', height: canvasState.birth_info.height || 'auto' }}
                                    position={{ x: canvasState.birth_info.x, y: canvasState.birth_info.y }}
                                    onDragStop={(e, d) => updateElement('birth_info', { x: d.x, y: d.y })}
                                    onResizeStop={(e, dir, ref, delta, position) => {
                                        updateElement('birth_info', { width: parseInt(ref.style.width, 10), ...position });
                                    }}
                                    enableResizing={{ top: false, right: true, bottom: false, left: false, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false }}
                                    bounds="parent"
                                    onClick={(e: React.MouseEvent | React.TouchEvent) => { e.stopPropagation(); setSelectedElement('birth_info'); }}
                                    className={`cursor-move px-1 border-2 ${selectedElement === 'birth_info' ? 'border-primary ring-2 ring-primary/30 bg-primary/10 z-50' : 'border-transparent hover:border-dashed hover:border-gray-400'} flex items-center whitespace-nowrap`}
                                    style={{
                                        fontSize: `${canvasState.birth_info.fontSize}px`,
                                        color: canvasState.birth_info.color,
                                        fontFamily: canvasState.birth_info.fontFamily,
                                        fontWeight: canvasState.birth_info.fontWeight === 'bold' ? 'bold' : 'normal',
                                        fontStyle: canvasState.birth_info.fontStyle === 'italic' ? 'italic' : 'normal',
                                    }}
                                >
                                    {(() => {
                                        const originalText = MOCK_STUDENT.birth_info;
                                        const { text: fittedText, transform } = getAutoFitTextAndTransform(originalText, (canvasState.birth_info.width || 100) - 12, canvasState.birth_info.fontSize || 14);
                                        return (
                                            <div style={{
                                                textAlign: canvasState.birth_info.textAlign || 'left',
                                                transformOrigin: canvasState.birth_info.textAlign === 'center' ? 'center center' : canvasState.birth_info.textAlign === 'right' ? 'right center' : 'left center',
                                                transform: transform,
                                                width: '100%',
                                            }}>
                                                {fittedText}
                                            </div>
                                        );
                                    })()}
                                </Rnd>
                            )}

                            {/* TEXT: ADDRESS */}
                            {canvasState.address?.visible && (
                                <Rnd
                                    size={{ width: canvasState.address.width || 'auto', height: canvasState.address.height || 'auto' }}
                                    position={{ x: canvasState.address.x, y: canvasState.address.y }}
                                    onDragStop={(e, d) => updateElement('address', { x: d.x, y: d.y })}
                                    onResizeStop={(e, dir, ref, delta, position) => {
                                        updateElement('address', { width: parseInt(ref.style.width, 10), ...position });
                                    }}
                                    enableResizing={{ top: false, right: true, bottom: false, left: false, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false }}
                                    bounds="parent"
                                    onClick={(e: React.MouseEvent | React.TouchEvent) => { e.stopPropagation(); setSelectedElement('address'); }}
                                    className={`cursor-move px-1 border-2 ${selectedElement === 'address' ? 'border-primary ring-2 ring-primary/30 bg-primary/10 z-50' : 'border-transparent hover:border-dashed hover:border-gray-400'} flex items-center whitespace-nowrap`}
                                    style={{
                                        fontSize: `${canvasState.address.fontSize}px`,
                                        color: canvasState.address.color,
                                        fontFamily: canvasState.address.fontFamily,
                                        fontWeight: canvasState.address.fontWeight === 'bold' ? 'bold' : 'normal',
                                        fontStyle: canvasState.address.fontStyle === 'italic' ? 'italic' : 'normal',
                                    }}
                                >
                                    {(() => {
                                        const originalText = MOCK_STUDENT.address;
                                        const { text: fittedText, transform } = getAutoFitTextAndTransform(originalText, (canvasState.address.width || 100) - 12, canvasState.address.fontSize || 12);
                                        return (
                                            <div style={{
                                                textAlign: canvasState.address.textAlign || 'left',
                                                transformOrigin: canvasState.address.textAlign === 'center' ? 'center center' : canvasState.address.textAlign === 'right' ? 'right center' : 'left center',
                                                transform: transform,
                                                width: '100%',
                                            }}>
                                                {fittedText}
                                            </div>
                                        );
                                    })()}
                                </Rnd>
                            )}

                            {/* TEXT: JURUSAN */}
                            {canvasState.jurusan.visible && (
                                <Rnd
                                    size={{ width: canvasState.jurusan.width || 'auto', height: canvasState.jurusan.height || 'auto' }}
                                    position={{ x: canvasState.jurusan.x, y: canvasState.jurusan.y }}
                                    onDragStop={(e, d) => updateElement('jurusan', { x: d.x, y: d.y })}
                                    onResizeStop={(e, dir, ref, delta, position) => {
                                        updateElement('jurusan', { width: parseInt(ref.style.width, 10), ...position });
                                    }}
                                    enableResizing={{ top: false, right: true, bottom: false, left: false, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false }}
                                    bounds="parent"
                                    onClick={(e: React.MouseEvent | React.TouchEvent) => { e.stopPropagation(); setSelectedElement('jurusan'); }}
                                    className={`cursor-move px-1 border-2 ${selectedElement === 'jurusan' ? 'border-primary ring-2 ring-primary/30 bg-primary/10 z-50' : 'border-transparent hover:border-dashed hover:border-gray-400'} flex items-center whitespace-nowrap`}
                                    style={{
                                        fontSize: `${canvasState.jurusan.fontSize}px`,
                                        color: canvasState.jurusan.color,
                                        fontFamily: canvasState.jurusan.fontFamily,
                                        fontWeight: canvasState.jurusan.fontWeight === 'bold' ? 'bold' : 'normal',
                                        fontStyle: canvasState.jurusan.fontStyle === 'italic' ? 'italic' : 'normal',
                                    }}
                                >
                                    {(() => {
                                        const originalText = MOCK_STUDENT.jurusan;
                                        const { text: fittedText, transform } = getAutoFitTextAndTransform(originalText, (canvasState.jurusan.width || 100) - 12, canvasState.jurusan.fontSize || 14);
                                        return (
                                            <div style={{
                                                textAlign: canvasState.jurusan.textAlign || 'left',
                                                transformOrigin: canvasState.jurusan.textAlign === 'center' ? 'center center' : canvasState.jurusan.textAlign === 'right' ? 'right center' : 'left center',
                                                transform: transform,
                                                width: '100%',
                                            }}>
                                                {fittedText}
                                            </div>
                                        );
                                    })()}
                                </Rnd>
                            )}
                        </>
                    )}

                    {/* --- BACK SIDE ELEMENTS --- */}
                    {activeSide === 'back' && (
                        <>
                            {/* BACK LOGO */}
                            {canvasState.back_logo?.visible && (
                                <Rnd
                                    size={{ width: canvasState.back_logo.width || 100, height: canvasState.back_logo.height || 100 }}
                                    position={{ x: canvasState.back_logo.x, y: canvasState.back_logo.y }}
                                    onDragStop={(e, d) => updateElement('back_logo', { x: d.x, y: d.y })}
                                    onResizeStop={(e, dir, ref, delta, position) => {
                                        updateElement('back_logo', {
                                            width: parseInt(ref.style.width, 10),
                                            height: parseInt(ref.style.height, 10),
                                            ...position
                                        });
                                    }}
                                    bounds="parent"
                                    onClick={(e: React.MouseEvent | React.TouchEvent) => { e.stopPropagation(); setSelectedElement('back_logo'); }}
                                    className={`border-2 ${selectedElement === 'back_logo' ? 'border-primary ring-2 ring-primary/30 z-50' : 'border-dashed border-transparent hover:border-gray-400'} flex items-center justify-center cursor-move transition-colors overflow-hidden`}
                                    style={{
                                        borderRadius: canvasState.back_logo.shape === 'circle' ? '50%' : canvasState.back_logo.shape === 'box' ? `${canvasState.back_logo.borderRadius || 0}px` : '0',
                                    }}
                                >
                                    <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                        <Shield className="w-1/2 h-1/2" />
                                    </div>
                                </Rnd>
                            )}

                            {/* BACK TEXT: SCHOOL NAME */}
                            {canvasState.back_school_name?.visible && (
                                <Rnd
                                    size={{ width: canvasState.back_school_name.width || 'auto', height: canvasState.back_school_name.height || 'auto' }}
                                    position={{ x: canvasState.back_school_name.x, y: canvasState.back_school_name.y }}
                                    onDragStop={(e, d) => updateElement('back_school_name', { x: d.x, y: d.y })}
                                    onResizeStop={(e, dir, ref, delta, position) => {
                                        updateElement('back_school_name', { width: parseInt(ref.style.width, 10), ...position });
                                    }}
                                    enableResizing={{ top: false, right: true, bottom: false, left: false, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false }}
                                    bounds="parent"
                                    onClick={(e: React.MouseEvent | React.TouchEvent) => { e.stopPropagation(); setSelectedElement('back_school_name'); }}
                                    className={`cursor-move px-1 border-2 ${selectedElement === 'back_school_name' ? 'border-primary ring-2 ring-primary/30 bg-primary/10 z-50' : 'border-transparent hover:border-dashed hover:border-gray-400'} flex items-center whitespace-nowrap`}
                                    style={{
                                        fontSize: `${canvasState.back_school_name.fontSize}px`,
                                        color: canvasState.back_school_name.color,
                                        fontFamily: canvasState.back_school_name.fontFamily,
                                        fontWeight: canvasState.back_school_name.fontWeight === 'bold' ? 'bold' : 'normal',
                                        fontStyle: canvasState.back_school_name.fontStyle === 'italic' ? 'italic' : 'normal',
                                    }}
                                >
                                    {(() => {
                                        const originalText = MOCK_STUDENT.school_name;
                                        // Pass 'false' to allowAbbreviation to strictly squish school names instead of abbreviating
                                        const { text: fittedText, transform } = getAutoFitTextAndTransform(originalText, (canvasState.back_school_name.width || 100) - 12, canvasState.back_school_name.fontSize || 14, false);
                                        return (
                                            <div style={{
                                                textAlign: canvasState.back_school_name.textAlign || 'left',
                                                transformOrigin: canvasState.back_school_name.textAlign === 'center' ? 'center center' : canvasState.back_school_name.textAlign === 'right' ? 'right center' : 'left center',
                                                transform: transform,
                                                width: '100%',
                                            }}>
                                                {fittedText}
                                            </div>
                                        );
                                    })()}
                                </Rnd>
                            )}

                            {/* BACK TEXT */}
                            {canvasState.back_text?.visible && (
                                <Rnd
                                    position={{ x: canvasState.back_text.x, y: canvasState.back_text.y }}
                                    onDragStop={(e, d) => updateElement('back_text', { x: d.x, y: d.y })}
                                    enableResizing={false}
                                    bounds="parent"
                                    onClick={(e: React.MouseEvent | React.TouchEvent) => { e.stopPropagation(); setSelectedElement('back_text'); }}
                                    className={`cursor-move px-1 border-2 ${selectedElement === 'back_text' ? 'border-primary ring-2 ring-primary/30 bg-primary/10 z-50' : 'border-transparent hover:border-dashed hover:border-gray-400'}`}
                                    style={{
                                        fontSize: `${canvasState.back_text.fontSize}px`,
                                        color: canvasState.back_text.color,
                                        fontFamily: canvasState.back_text.fontFamily,
                                        fontWeight: canvasState.back_text.fontWeight === 'bold' ? 'bold' : 'normal',
                                        fontStyle: canvasState.back_text.fontStyle === 'italic' ? 'italic' : 'normal',
                                    }}
                                >
                                    <div style={{ 
                                        whiteSpace: 'pre-wrap', 
                                        maxWidth: `${CANVAS_WIDTH - 40}px`,
                                        textAlign: canvasState.back_text.textAlign || 'left'
                                    }}>
                                        {canvasState.back_text.text || ''}
                                    </div>
                                </Rnd>
                            )}

                            {/* BACK TEXT: NAMA KEPALA SEKOLAH */}
                            {canvasState.back_nama_kepala_sekolah?.visible && (
                                <Rnd
                                    size={{ width: canvasState.back_nama_kepala_sekolah.width || 'auto', height: canvasState.back_nama_kepala_sekolah.height || 'auto' }}
                                    position={{ x: canvasState.back_nama_kepala_sekolah.x, y: canvasState.back_nama_kepala_sekolah.y }}
                                    onDragStop={(e, d) => updateElement('back_nama_kepala_sekolah', { x: d.x, y: d.y })}
                                    onResizeStop={(e, dir, ref, delta, position) => {
                                        updateElement('back_nama_kepala_sekolah', { width: parseInt(ref.style.width, 10), ...position });
                                    }}
                                    enableResizing={{ top: false, right: true, bottom: false, left: false, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false }}
                                    bounds="parent"
                                    onClick={(e: React.MouseEvent | React.TouchEvent) => { e.stopPropagation(); setSelectedElement('back_nama_kepala_sekolah'); }}
                                    className={`cursor-move px-1 border-2 ${selectedElement === 'back_nama_kepala_sekolah' ? 'border-primary ring-2 ring-primary/30 bg-primary/10 z-50' : 'border-transparent hover:border-dashed hover:border-gray-400'} flex items-center whitespace-nowrap`}
                                    style={{
                                        fontSize: `${canvasState.back_nama_kepala_sekolah.fontSize}px`,
                                        color: canvasState.back_nama_kepala_sekolah.color,
                                        fontFamily: canvasState.back_nama_kepala_sekolah.fontFamily,
                                        fontWeight: canvasState.back_nama_kepala_sekolah.fontWeight === 'bold' ? 'bold' : 'normal',
                                        fontStyle: canvasState.back_nama_kepala_sekolah.fontStyle === 'italic' ? 'italic' : 'normal',
                                    }}
                                >
                                    {(() => {
                                        const originalText = MOCK_STUDENT.back_nama_kepala_sekolah;
                                        const { text: fittedText, transform } = getAutoFitTextAndTransform(originalText, (canvasState.back_nama_kepala_sekolah.width || 100) - 12, canvasState.back_nama_kepala_sekolah.fontSize || 14);
                                        return (
                                            <div style={{
                                                textAlign: canvasState.back_nama_kepala_sekolah.textAlign || 'left',
                                                transformOrigin: canvasState.back_nama_kepala_sekolah.textAlign === 'center' ? 'center center' : canvasState.back_nama_kepala_sekolah.textAlign === 'right' ? 'right center' : 'left center',
                                                transform: transform,
                                                width: '100%',
                                            }}>
                                                {fittedText}
                                            </div>
                                        );
                                    })()}
                                </Rnd>
                            )}

                            {/* BACK TEXT: NIP KEPALA SEKOLAH */}
                            {canvasState.back_nip_kepala_sekolah?.visible && (
                                <Rnd
                                    size={{ width: canvasState.back_nip_kepala_sekolah.width || 'auto', height: canvasState.back_nip_kepala_sekolah.height || 'auto' }}
                                    position={{ x: canvasState.back_nip_kepala_sekolah.x, y: canvasState.back_nip_kepala_sekolah.y }}
                                    onDragStop={(e, d) => updateElement('back_nip_kepala_sekolah', { x: d.x, y: d.y })}
                                    onResizeStop={(e, dir, ref, delta, position) => {
                                        updateElement('back_nip_kepala_sekolah', { width: parseInt(ref.style.width, 10), ...position });
                                    }}
                                    enableResizing={{ top: false, right: true, bottom: false, left: false, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false }}
                                    bounds="parent"
                                    onClick={(e: React.MouseEvent | React.TouchEvent) => { e.stopPropagation(); setSelectedElement('back_nip_kepala_sekolah'); }}
                                    className={`cursor-move px-1 border-2 ${selectedElement === 'back_nip_kepala_sekolah' ? 'border-primary ring-2 ring-primary/30 bg-primary/10 z-50' : 'border-transparent hover:border-dashed hover:border-gray-400'} flex items-center whitespace-nowrap`}
                                    style={{
                                        fontSize: `${canvasState.back_nip_kepala_sekolah.fontSize}px`,
                                        color: canvasState.back_nip_kepala_sekolah.color,
                                        fontFamily: canvasState.back_nip_kepala_sekolah.fontFamily,
                                        fontWeight: canvasState.back_nip_kepala_sekolah.fontWeight === 'bold' ? 'bold' : 'normal',
                                        fontStyle: canvasState.back_nip_kepala_sekolah.fontStyle === 'italic' ? 'italic' : 'normal',
                                    }}
                                >
                                    {(() => {
                                        const originalText = MOCK_STUDENT.back_nip_kepala_sekolah;
                                        const { text: fittedText, transform } = getAutoFitTextAndTransform(originalText, (canvasState.back_nip_kepala_sekolah.width || 100) - 12, canvasState.back_nip_kepala_sekolah.fontSize || 14);
                                        return (
                                            <div style={{
                                                textAlign: canvasState.back_nip_kepala_sekolah.textAlign || 'left',
                                                transformOrigin: canvasState.back_nip_kepala_sekolah.textAlign === 'center' ? 'center center' : canvasState.back_nip_kepala_sekolah.textAlign === 'right' ? 'right center' : 'left center',
                                                transform: transform,
                                                width: '100%',
                                            }}>
                                                {fittedText}
                                            </div>
                                        );
                                    })()}
                                </Rnd>
                            )}
                        </>
                    )}

                </div>

                {/* Sidebar Setup */}
                {renderSidebar()}
            </div>
        </div>
    )
}
