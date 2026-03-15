"use client"

import { useState, useEffect, useCallback } from "react"
import { Save, Building2, Clock, CheckSquare, AlertTriangle, Bell, Calendar, RefreshCw, UploadCloud, ImageIcon, Timer, Trash2, Plus } from "lucide-react"
import { parseShortenedDays } from "@/lib/schedule-utils"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Calendar as CalendarReact } from "@/components/ui/calendar"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { AcademicYear } from "@/types"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import Image from "next/image"

// ---- Types ----------------------------------------------------------------

type SettingGroup = Record<string, string>
type AllSettings = {
    school: SettingGroup
    schedule: SettingGroup
    attendance: SettingGroup
    discipline: SettingGroup
    notify: SettingGroup
}

// ---- Defaults (mirrors backend SCHEMA) ------------------------------------

const DEFAULTS: AllSettings = {
    school: {
        principal_name: "", principal_nip: "", school_logo_url: "", school_address: "",
    },
    schedule: {
        active_days: "1,2,3,4,5", active_semester: "ganjil", holidays: "",
        default_period_duration_minutes: "45", shortened_period_days: "",
    },
    attendance: {
        school_start_time: "07:00", school_end_time: "14:00",
        tolerance_late_minutes: "15", token_ttl_minutes: "30", absent_mode: "token", kiosk_token: "",
        kiosk_inactivity_timeout_minutes: "20",
    },
    discipline: {
        notify_threshold: "3", parent_notify_mode: "none", points_validity: "academic_year",
        action_threshold_sp1: "25", action_threshold_sp2: "50", action_threshold_parent_call: "75", action_threshold_suspension: "100",
    },
    notify: {
        whatsapp_enabled: "false", whatsapp_admin_number: "",
    },
}

const DAYS = [
    { value: "1", label: "Senin" }, { value: "2", label: "Selasa" },
    { value: "3", label: "Rabu" }, { value: "4", label: "Kamis" },
    { value: "5", label: "Jumat" }, { value: "6", label: "Sabtu" },
    { value: "7", label: "Minggu" },
]

// ---- Component ------------------------------------------------------------

export default function PengaturanPage() {
    const [settings, setSettings] = useState<AllSettings>(DEFAULTS)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState<string | null>(null)
    const [activeYear, setActiveYear] = useState<AcademicYear | null>(null)
    const [editingHoliday, setEditingHoliday] = useState<string | null>(null)
    const [isSyncingHolidays, setIsSyncingHolidays] = useState(false)
    const [isUploadingLogo, setIsUploadingLogo] = useState(false)

    // Shortened period days state
    const [shortenedSelection, setShortenedSelection] = useState<Date[]>([])
    const [shortenedLabel, setShortenedLabel] = useState("Ramadan")
    const [shortenedDuration, setShortenedDuration] = useState("30")

    // Active days as a set for easy toggle
    const activeDays = new Set((settings.schedule.active_days || "").split(",").filter(Boolean))

    // ---- Data fetching ----

    const fetchSettings = useCallback(async () => {
        setIsLoading(true)
        try {
            const [setRes, acRes] = await Promise.all([
                api.get("/settings"),
                api.get("/academic-years")
            ])
            const data: AllSettings = setRes.data.data
            // Deep per-group merge: keep DEFAULTS keys for any group key not in the API response
            setSettings({
                school: { ...DEFAULTS.school, ...(data.school || {}) },
                schedule: { ...DEFAULTS.schedule, ...(data.schedule || {}) },
                attendance: { ...DEFAULTS.attendance, ...(data.attendance || {}) },
                discipline: { ...DEFAULTS.discipline, ...(data.discipline || {}) },
                notify: { ...DEFAULTS.notify, ...(data.notify || {}) },
            })

            const years: AcademicYear[] = acRes.data.data || []
            const active = years.find(y => y.is_active)
            if (active) setActiveYear(active)
        } catch {
            toast.error("Gagal memuat pengaturan")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => { fetchSettings() }, [fetchSettings])

    // ---- Helpers ----

    const set = (group: keyof AllSettings, key: string, value: string) => {
        setSettings(prev => ({
            ...prev,
            [group]: { ...prev[group], [key]: value },
        }))
    }

    const toggleDay = (day: string) => {
        const next = new Set(activeDays)
        if (next.has(day)) {
            next.delete(day)
        } else {
            next.add(day)
        }
        set("schedule", "active_days", [...next].sort().join(","))
    }

    type Holiday = { date: string, name: string }

    const getHolidays = (): Holiday[] => {
        const str = settings.schedule.holidays || ""
        if (!str) return []
        try {
            if (str.startsWith("[")) return JSON.parse(str)
        } catch { }
        return str.split(",").filter(Boolean).map(d => ({ date: d, name: "Hari Libur" }))
    }

    const holidays = getHolidays()
    const parsedHolidays = holidays.map(h => parseISO(h.date))

    const handleHolidaysChange = (dates: Date[] | undefined) => {
        if (!dates) return set("schedule", "holidays", "")
        const nextHolidays = dates.map(d => {
            const dStr = format(d, "yyyy-MM-dd")
            const existing = holidays.find(h => h.date === dStr)
            return { date: dStr, name: existing ? existing.name : "Hari Libur" }
        })
        set("schedule", "holidays", JSON.stringify(nextHolidays))
    }

    // ---- Shortened Period Days helpers -----------------------------------

    const shortenedDays = parseShortenedDays(settings.schedule.shortened_period_days)
    const parsedShortenedDates = shortenedDays.map(d => parseISO(d.date))

    const addShortenedDays = () => {
        if (shortenedSelection.length === 0) return
        const durationMinutes = parseInt(shortenedDuration) || 30
        const label = shortenedLabel.trim() || "Jadwal Dipersingkat"

        const existing = new Map(shortenedDays.map(d => [d.date, d]))
        shortenedSelection.forEach(date => {
            const dStr = format(date, "yyyy-MM-dd")
            existing.set(dStr, { date: dStr, label, duration_minutes: durationMinutes })
        })
        const sorted = Array.from(existing.values()).sort((a, b) => a.date.localeCompare(b.date))
        set("schedule", "shortened_period_days", JSON.stringify(sorted))
        setShortenedSelection([])
    }

    const removeShortenedDay = (dateStr: string) => {
        const next = shortenedDays.filter(d => d.date !== dateStr)
        set("schedule", "shortened_period_days", JSON.stringify(next))
    }

    const renameHoliday = (dateStr: string, newName: string) => {
        const nextHolidays = holidays.map(h => h.date === dateStr ? { ...h, name: newName || "Hari Libur" } : h)
        set("schedule", "holidays", JSON.stringify(nextHolidays))
    }

    const syncHolidays = async () => {
        if (!activeYear) {
            toast.error("Tidak ada tahun ajaran aktif")
            return
        }
        setIsSyncingHolidays(true)
        try {
            const startYear = parseISO(activeYear.start_date).getFullYear()
            const endYear = parseISO(activeYear.end_date).getFullYear()
            const yearsToFetch = startYear === endYear ? [startYear] : [startYear, endYear]

            const fetchedHolidays: Holiday[] = []
            for (const year of yearsToFetch) {
                const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/ID`)
                if (res.ok) {
                    const data = await res.json()
                    data.forEach((h: { date: string, localName: string }) => {
                        if (h.date >= activeYear.start_date && h.date <= activeYear.end_date) {
                            fetchedHolidays.push({ date: h.date, name: h.localName })
                        }
                    })
                }
            }

            const existingMap = new Map(holidays.map(h => [h.date, h]))
            let addedCount = 0
            fetchedHolidays.forEach(h => {
                if (!existingMap.has(h.date)) {
                    existingMap.set(h.date, h)
                    addedCount++
                }
            })

            const nextHolidays = Array.from(existingMap.values()).sort((a, b) => a.date.localeCompare(b.date))
            set("schedule", "holidays", JSON.stringify(nextHolidays))

            if (addedCount > 0) {
                toast.success(`Berhasil menambahkan ${addedCount} libur nasional`)
            } else {
                toast.info("Libur nasional sudah tersinkronisasi")
            }
        } catch {
            toast.error("Gagal sinkronisasi libur nasional")
        } finally {
            setIsSyncingHolidays(false)
        }
    }

    // ---- Save ----

    const saveGroup = async (group: keyof AllSettings) => {
        setIsSaving(group)
        try {
            const payload = Object.entries(settings[group]).map(([key, value]) => ({
                group, key, value,
            }))
            await api.put("/settings", { settings: payload })
            toast.success("Pengaturan berhasil disimpan")
        } catch {
            toast.error("Gagal menyimpan pengaturan")
        } finally {
            setIsSaving(null)
        }
    }

    // ---- Logo Upload ----

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            toast.error("File terlalu besar (Maksimal 2MB)")
            return
        }

        setIsUploadingLogo(true)
        try {
            const formData = new FormData()
            formData.append('logo', file)

            const res = await api.post("/settings/logo", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            // Update local state proactively
            if (res.data.path) {
                set("school", "school_logo_url", res.data.path)
                toast.success("Logo sekolah berhasil diperbarui")
            }
        } catch {
            toast.error("Gagal mengunggah logo sekolah")
        } finally {
            setIsUploadingLogo(false)
        }
    }

    // ---- Save button component ----

    const SaveBtn = ({ group }: { group: keyof AllSettings }) => (
        <Button
            onClick={() => saveGroup(group)}
            disabled={isSaving === group}
            className="gap-2"
        >
            <Save className="h-4 w-4" />
            {isSaving === group ? "Menyimpan..." : "Simpan"}
        </Button>
    )

    if (isLoading) {
        return (
            <div className="p-6 flex items-center justify-center h-60 text-muted-foreground">
                Memuat pengaturan...
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
                <p className="text-muted-foreground">Konfigurasi umum untuk sekolah Anda.</p>
            </div>

            <Tabs defaultValue="school">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="school" className="gap-1.5">
                        <Building2 className="h-4 w-4" /> Sekolah
                    </TabsTrigger>
                    <TabsTrigger value="schedule" className="gap-1.5">
                        <Clock className="h-4 w-4" /> Jadwal
                    </TabsTrigger>
                    <TabsTrigger value="attendance" className="gap-1.5">
                        <CheckSquare className="h-4 w-4" /> Absensi
                    </TabsTrigger>
                    <TabsTrigger value="discipline" className="gap-1.5">
                        <AlertTriangle className="h-4 w-4" /> Disiplin
                    </TabsTrigger>
                    <TabsTrigger value="libur" className="gap-1.5">
                        <Calendar className="h-4 w-4" /> Hari Libur
                    </TabsTrigger>
                    <TabsTrigger value="notify" className="gap-1.5">
                        <Bell className="h-4 w-4" /> Notifikasi
                    </TabsTrigger>
                </TabsList>

                {/* ── SEKOLAH ─────────────────────────────────────────── */}
                <TabsContent value="school">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profil Sekolah</CardTitle>
                            <CardDescription>Informasi dasar sekolah yang muncul di laporan dan dokumen.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col sm:flex-row gap-6 items-start">
                                <div className="border rounded-md bg-muted/20 p-4 border-dashed flex flex-col items-center justify-center text-center w-full sm:w-48 shrink-0">
                                    <Label className="cursor-pointer flex flex-col items-center gap-2 mb-2 w-full">
                                        <span className="text-sm font-semibold">Logo Sekolah</span>
                                        <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border-2 border-muted relative group">
                                            {settings.school.school_logo_url ? (
                                                <Image
                                                    src={settings.school.school_logo_url.startsWith('http') ? settings.school.school_logo_url : `${process.env.NEXT_PUBLIC_ASSET_URL}${settings.school.school_logo_url}`}
                                                    alt="Logo Sekolah"
                                                    width={96}
                                                    height={96}
                                                    className="w-full h-full object-cover"
                                                    unoptimized
                                                />
                                            ) : (
                                                <ImageIcon className="w-8 h-8 text-muted-foreground opacity-50" />
                                            )}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs">
                                                <UploadCloud className="w-5 h-5 mb-1" />
                                                Ganti
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-1 max-w-[120px]">
                                            Maks 2MB (JPG/PNG). Rekomendasi 1:1.
                                        </p>
                                        <Input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            disabled={isUploadingLogo}
                                        />
                                    </Label>
                                    {isUploadingLogo && <span className="text-xstext-muted-foreground animate-pulse mt-1">Mengunggah...</span>}
                                </div>

                                <div className="space-y-4 flex-1 w-full">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Nama Kepala Sekolah</Label>
                                            <Input
                                                value={settings.school.principal_name}
                                                onChange={e => set("school", "principal_name", e.target.value)}
                                                placeholder="Contoh: Drs. Budi Santoso, M.Pd."
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>NIP Kepala Sekolah</Label>
                                            <Input
                                                value={settings.school.principal_nip}
                                                onChange={e => set("school", "principal_nip", e.target.value)}
                                                placeholder="Contoh: 198001012005011001"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Alamat Sekolah</Label>
                                        <Input
                                            value={settings.school.school_address}
                                            onChange={e => set("school", "school_address", e.target.value)}
                                            placeholder="Contoh: Jl. Pendidikan No. 1, Kota..."
                                        />
                                    </div>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex justify-end">
                                <SaveBtn group="school" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── JADWAL ──────────────────────────────────────────── */}
                <TabsContent value="schedule">
                    <Card>
                        <CardHeader>
                            <CardTitle>Jadwal Sekolah</CardTitle>
                            <CardDescription>Atur jam operasional, hari aktif, dan semester yang berlaku.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-2">
                                <Label>Semester Aktif</Label>
                                <Select
                                    value={settings.schedule.active_semester}
                                    onValueChange={v => set("schedule", "active_semester", v)}
                                >
                                    <SelectTrigger className="w-48">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ganjil">Semester Ganjil</SelectItem>
                                        <SelectItem value="genap">Semester Genap</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-3">
                                <Label>Hari Sekolah Aktif</Label>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS.map(d => (
                                        <button
                                            key={d.value}
                                            type="button"
                                            onClick={() => toggleDay(d.value)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${activeDays.has(d.value)
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-background text-muted-foreground border-border hover:border-primary"
                                                }`}
                                        >
                                            {d.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Klik hari untuk mengaktifkan/menonaktifkan.
                                </p>
                            </div>
                            <Separator />
                            <div className="flex justify-end">
                                <SaveBtn group="schedule" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── ABSENSI ─────────────────────────────────────────── */}
                <TabsContent value="attendance">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pengaturan Absensi</CardTitle>
                             <CardDescription>Atur jam operasional, mode absen, toleransi keterlambatan, dan token.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Jam Masuk Sekolah</Label>
                                    <Input
                                        type="time"
                                        value={settings.attendance.school_start_time}
                                        onChange={e => set("attendance", "school_start_time", e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Jam Pulang Sekolah</Label>
                                    <Input
                                        type="time"
                                        value={settings.attendance.school_end_time}
                                        onChange={e => set("attendance", "school_end_time", e.target.value)}
                                    />
                                </div>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Mode Absensi</Label>
                                    <Select
                                        onValueChange={v => set("attendance", "absent_mode", v)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="token">Token Harian</SelectItem>
                                            <SelectItem value="qr">QR Code</SelectItem>
                                            <SelectItem value="manual">Manual (Guru)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Kiosk Token</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="text"
                                            value={settings.attendance.kiosk_token || ""}
                                            onChange={e => set("attendance", "kiosk_token", e.target.value)}
                                            placeholder="contoh: secret-sekolah-123"
                                            className="w-full font-mono text-sm"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => set("attendance", "kiosk_token", Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15))}
                                        >
                                            Generate
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Digunakan pada URL Anjungan: <code className="bg-muted px-1 rounded">/kiosk</code> atau <code className="bg-muted px-1 rounded">/lite-kiosk</code>
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Toleransi Keterlambatan</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min={0}
                                            max={120}
                                            value={settings.attendance.tolerance_late_minutes}
                                            onChange={e => set("attendance", "tolerance_late_minutes", e.target.value)}
                                            className="w-28"
                                        />
                                        <span className="text-sm text-muted-foreground">menit</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Siswa yang tiba setelah jam masuk + toleransi ini dinyatakan terlambat.
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Durasi Token Berlaku</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min={5}
                                            max={480}
                                            value={settings.attendance.token_ttl_minutes}
                                            onChange={e => set("attendance", "token_ttl_minutes", e.target.value)}
                                            className="w-28"
                                        />
                                        <span className="text-sm text-muted-foreground">menit</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Setelah durasi ini habis, token absen tidak dapat digunakan.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="flex items-center gap-1.5">
                                        <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                                        Waktu Tidak Aktif Kiosk
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min={1}
                                            max={480}
                                            value={settings.attendance.kiosk_inactivity_timeout_minutes}
                                            onChange={e => set("attendance", "kiosk_inactivity_timeout_minutes", e.target.value)}
                                            className="w-28"
                                        />
                                        <span className="text-sm text-muted-foreground">menit</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Setelah kiosk tidak aktif selama durasi ini, absensi siswa akan otomatis tersinkronisasi ke server.
                                    </p>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex justify-end">
                                <SaveBtn group="attendance" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── DISIPLIN ────────────────────────────────────────── */}
                <TabsContent value="discipline">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pengaturan Disiplin</CardTitle>
                            <CardDescription>Atur threshold notifikasi dan mode pemberitahuan orang tua.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Jumlah Pelanggaran Sebelum Notifikasi</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={settings.discipline.notify_threshold}
                                        onChange={e => set("discipline", "notify_threshold", e.target.value)}
                                        className="w-28"
                                    />
                                    <span className="text-sm text-muted-foreground">pelanggaran</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Orang tua akan diberitahu ketika siswa mencapai jumlah pelanggaran ini.
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label>Masa Berlaku Poin</Label>
                                <Select
                                    value={settings.discipline.points_validity}
                                    onValueChange={v => set("discipline", "points_validity", v)}
                                >
                                    <SelectTrigger className="w-full sm:w-64">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="academic_year">Per Tahun Ajaran (Reset Naik Kelas)</SelectItem>
                                        <SelectItem value="forever">Selamanya (Tidak Ada Reset)</SelectItem>
                                        <SelectItem value="reduction">Sistem Pengurangan Poin</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Pilih bagaimana poin pelanggaran siswa diperlakukan seiring waktu.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                <div className="grid gap-2">
                                    <Label>Mode Notifikasi Orang Tua</Label>
                                    <Select
                                        value={settings.discipline.parent_notify_mode}
                                        onValueChange={v => set("discipline", "parent_notify_mode", v)}
                                    >
                                        <SelectTrigger className="w-48">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Tidak Ada Notifikasi</SelectItem>
                                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                            <SelectItem value="email">Email</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid gap-2 mt-2">
                                <h3 className="text-sm font-semibold">Tindak Lanjut Pelanggaran (Poin)</h3>
                                <p className="text-xs text-muted-foreground mb-2">Tentukan batas minimal poin untuk setiap tindakan disiplin.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Surat Peringatan 1 (SP1)</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                min={1}
                                                value={settings.discipline.action_threshold_sp1}
                                                onChange={e => set("discipline", "action_threshold_sp1", e.target.value)}
                                            />
                                            <span className="text-sm text-muted-foreground">poin</span>
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Surat Peringatan 2 (SP2)</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                min={1}
                                                value={settings.discipline.action_threshold_sp2}
                                                onChange={e => set("discipline", "action_threshold_sp2", e.target.value)}
                                            />
                                            <span className="text-sm text-muted-foreground">poin</span>
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Pemanggilan Orang Tua</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                min={1}
                                                value={settings.discipline.action_threshold_parent_call}
                                                onChange={e => set("discipline", "action_threshold_parent_call", e.target.value)}
                                            />
                                            <span className="text-sm text-muted-foreground">poin</span>
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Skorsing</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                min={1}
                                                value={settings.discipline.action_threshold_suspension}
                                                onChange={e => set("discipline", "action_threshold_suspension", e.target.value)}
                                            />
                                            <span className="text-sm text-muted-foreground">poin</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex justify-end">
                                <SaveBtn group="discipline" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="libur">
                    <Card>
                        <CardHeader>
                            <CardTitle>Hari Libur</CardTitle>
                            <CardDescription>Pilih tanggal merah atau libur nasional di luar hari akhir pekan.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {!activeYear ? (
                                <div className="text-sm text-muted-foreground p-4 border rounded-md">
                                    Belum ada tahun ajaran yang aktif. Silakan aktifkan tahun ajaran terlebih dahulu.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="flex justify-center border rounded-md p-4 bg-muted/10">
                                        <CalendarReact
                                            mode="multiple"
                                            selected={parsedHolidays}
                                            onSelect={handleHolidaysChange}
                                            defaultMonth={activeYear.start_date ? parseISO(activeYear.start_date) : new Date()}
                                            fromDate={activeYear.start_date ? parseISO(activeYear.start_date) : undefined}
                                            toDate={activeYear.end_date ? parseISO(activeYear.end_date) : undefined}
                                            locale={id}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <Label>Daftar Hari Libur Terpilih</Label>
                                        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
                                            {holidays.length === 0 ? (
                                                <p className="text-sm text-muted-foreground italic">Belum ada hari libur dipilih.</p>
                                            ) : (
                                                holidays.map((h, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between text-sm px-3 py-2 border rounded-md font-medium transition-colors hover:bg-muted/50 group"
                                                    >
                                                        <div
                                                            className="flex-1 cursor-pointer"
                                                            onDoubleClick={() => setEditingHoliday(h.date)}
                                                            title="Klik ganda untuk mengubah nama libur"
                                                        >
                                                            {editingHoliday === h.date ? (
                                                                <Input
                                                                    autoFocus
                                                                    defaultValue={h.name}
                                                                    className="h-7 text-sm"
                                                                    onBlur={(e) => {
                                                                        renameHoliday(h.date, e.target.value)
                                                                        setEditingHoliday(null)
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            renameHoliday(h.date, e.currentTarget.value)
                                                                            setEditingHoliday(null)
                                                                        }
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="flex flex-col gap-0.5 select-none">
                                                                    <span>{h.name}</span>
                                                                    <span className="text-xs text-muted-foreground font-normal">
                                                                        {format(parseISO(h.date), "EEEE, dd MMMM yyyy", { locale: id })}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                            onClick={() => {
                                                                const nextDates = parsedHolidays.filter(d => format(d, "yyyy-MM-dd") !== h.date);
                                                                handleHolidaysChange(nextDates);
                                                            }}
                                                            title="Hapus libur"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Separator />
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={syncHolidays}
                                    disabled={isSyncingHolidays || !activeYear}
                                    className="gap-2"
                                >
                                    <RefreshCw className={`h-4 w-4 ${isSyncingHolidays ? 'animate-spin' : ''}`} />
                                    {isSyncingHolidays ? "Menyinkronkan..." : "Sinkronisasi Libur Nasional"}
                                </Button>
                                <SaveBtn group="schedule" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Jadwal Dipersingkat ─────────────────────────────────── */}
                    <Card className="mt-4">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Timer className="h-5 w-5 text-amber-500" />
                                <div>
                                    <CardTitle>Jadwal Dipersingkat</CardTitle>
                                    <CardDescription className="mt-1">
                                        Tentukan hari-hari di mana durasi setiap jam pelajaran dipersingkat (mis. saat Ramadan).
                                        Durasi normal per jam pelajaran:{" "}
                                        <span className="font-semibold text-foreground">
                                            {settings.schedule.default_period_duration_minutes || "45"} menit
                                        </span>
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-2 max-w-xs">
                                <Label htmlFor="default-duration">Durasi Normal per Jam Pelajaran (menit)</Label>
                                <Input
                                    id="default-duration"
                                    type="number"
                                    min={1}
                                    max={120}
                                    value={settings.schedule.default_period_duration_minutes}
                                    onChange={e => set("schedule", "default_period_duration_minutes", e.target.value)}
                                    className="w-28"
                                />
                            </div>

                            <Separator />

                            {!activeYear ? (
                                <div className="text-sm text-muted-foreground p-4 border rounded-md">
                                    Belum ada tahun ajaran yang aktif.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="flex justify-center border rounded-md p-4 bg-muted/10">
                                            <CalendarReact
                                                mode="multiple"
                                                selected={shortenedSelection}
                                                onSelect={(dates) => setShortenedSelection(dates ?? [])}
                                                defaultMonth={activeYear.start_date ? parseISO(activeYear.start_date) : new Date()}
                                                fromDate={activeYear.start_date ? parseISO(activeYear.start_date) : undefined}
                                                toDate={activeYear.end_date ? parseISO(activeYear.end_date) : undefined}
                                                locale={id}
                                                modifiers={{ shortened: parsedShortenedDates }}
                                                modifiersClassNames={{ shortened: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full" }}
                                            />
                                        </div>
                                        {shortenedSelection.length > 0 && (
                                            <div className="border rounded-md p-4 bg-amber-50 dark:bg-amber-950/20 space-y-3">
                                                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                                                    {shortenedSelection.length} tanggal dipilih
                                                </p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="grid gap-1.5">
                                                        <Label className="text-xs">Label / Alasan</Label>
                                                        <Input
                                                            value={shortenedLabel}
                                                            onChange={e => setShortenedLabel(e.target.value)}
                                                            placeholder="mis. Ramadan"
                                                            className="h-8 text-sm"
                                                        />
                                                    </div>
                                                    <div className="grid gap-1.5">
                                                        <Label className="text-xs">Durasi (menit)</Label>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            max={90}
                                                            value={shortenedDuration}
                                                            onChange={e => setShortenedDuration(e.target.value)}
                                                            className="h-8 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <Button size="sm" onClick={addShortenedDays} className="gap-1.5 w-full">
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Tambah {shortenedSelection.length} Hari
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <Label>Daftar Hari Dipersingkat</Label>
                                        <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-2">
                                            {shortenedDays.length === 0 ? (
                                                <p className="text-sm text-muted-foreground italic">Belum ada hari jadwal dipersingkat.</p>
                                            ) : (
                                                shortenedDays.map((d, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between text-sm px-3 py-2 border rounded-md bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 group"
                                                    >
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center gap-2">
                                                                <Timer className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                                                <span className="font-medium text-amber-800 dark:text-amber-200">{d.label}</span>
                                                                <Badge variant="outline" className="h-5 text-[10px] border-amber-400 text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40">
                                                                    {d.duration_minutes} menit
                                                                </Badge>
                                                            </div>
                                                            <span className="text-xs text-muted-foreground pl-5">
                                                                {format(parseISO(d.date), "EEEE, dd MMMM yyyy", { locale: id })}
                                                            </span>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                            onClick={() => removeShortenedDay(d.date)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Separator />
                            <div className="flex justify-end">
                                <SaveBtn group="schedule" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── NOTIFIKASI ──────────────────────────────────────── */}
                <TabsContent value="notify">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notifikasi</CardTitle>
                            <CardDescription>Atur integrasi WhatsApp untuk notifikasi absen dan disiplin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium">WhatsApp Notifikasi</p>
                                    <p className="text-xs text-muted-foreground">
                                        Kirim notifikasi ketidakhadiran dan pelanggaran via WhatsApp
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.notify.whatsapp_enabled === "true"}
                                    onCheckedChange={v => set("notify", "whatsapp_enabled", String(v))}
                                />
                            </div>
                            {settings.notify.whatsapp_enabled === "true" && (
                                <div className="grid gap-2">
                                    <Label>Nomor WhatsApp Admin</Label>
                                    <Input
                                        type="tel"
                                        value={settings.notify.whatsapp_admin_number}
                                        onChange={e => set("notify", "whatsapp_admin_number", e.target.value)}
                                        placeholder="Contoh: 6281234567890"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Format internasional tanpa +. Contoh: 6281234567890
                                    </p>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-end">
                                <SaveBtn group="notify" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div >
    )
}
