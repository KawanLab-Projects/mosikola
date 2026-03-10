"use client"

import { useState, useCallback, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Upload, CheckCircle2, XCircle, Loader2, Clock, BookOpen, Users, School, AlertTriangle, Timer, Zap } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"
import { AcademicYear } from "@/types"
import { cn } from "@/lib/utils"
import { format, startOfWeek, addDays, isBefore, isToday, isSameDay, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { parseShortenedDays, getShortenedDay, computeAdjustedTimes, ShortenedPeriodDay, mergeConsecutiveSchedules } from "@/lib/schedule-utils"

// ---- Types ----------------------------------------------------------------

type MatchEntry = {
    xml_name: string
    db_id?: number
    db_name?: string
}

type MatchGroup = {
    matched: Record<string, MatchEntry>
    unmatched: Record<string, MatchEntry>
}

type PreviewData = {
    teachers: MatchGroup
    subjects: MatchGroup
    classrooms: MatchGroup
    cards_total: number
    cards_importable: number
    cards_skipped: number
}

type AutoCreate = {
    subjects: string[]
    classrooms: string[]
    teachers: string[]
}

type GeneratePreviewItem = {
    classroom: string
    subject: string
    teacher: string
    day_of_week: number
    period_start: number
    start_time: string
    end_time: string
}

type GenerateResult = {
    total: number
    unresolved_count: number
    unresolved: Array<{ classroom: string; subject: string; teacher: string }>
    preview: GeneratePreviewItem[]
}

type JournalAttendance = {
    hadir: number
    sakit: number
    izin: number
    alpha: number
}

type ScheduleJournal = {
    date: string
    filled_at?: string
    attendance?: JournalAttendance
    topic?: string
    notes?: string
    homework?: string
}

type Schedule = {
    id: number
    day_of_week: number
    period_start: number
    period_end: number
    start_time: string
    end_time: string
    subject?: { name: string }
    classroom?: { name: string; short?: string }
    teacher?: { name: string }
    journal?: ScheduleJournal
}

type MonitoringRecord = {
    teacher_id: number
    name: string
    nip?: string
    schedules: Schedule[]
}

// ---- Sub-components -------------------------------------------------------

function MatchSection({
    icon: Icon,
    label,
    entityKey,
    group,
    autoCreate,
    onToggle,
}: {
    icon: React.FC<{ className?: string }>
    label: string
    entityKey: keyof AutoCreate
    group: MatchGroup
    autoCreate: AutoCreate
    onToggle: (key: keyof AutoCreate, hexId: string, checked: boolean) => void
}) {
    const matchedList = Object.entries(group.matched)
    const unmatchedList = Object.entries(group.unmatched)
    const total = matchedList.length + unmatchedList.length
    const selectedCount = (autoCreate[entityKey] ?? []).length

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{label}</span>
                <Badge variant="outline" className="ml-auto text-xs">
                    {matchedList.length}/{total} cocok
                </Badge>
            </div>
            <div className="rounded-md border divide-y max-h-56 overflow-y-auto text-sm">
                {matchedList.map(([hexId, item]) => (
                    <div key={hexId} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span className="text-muted-foreground truncate">{item.xml_name}</span>
                        <span className="ml-auto text-emerald-600 dark:text-emerald-400 text-xs shrink-0">✓ {item.db_name}</span>
                    </div>
                ))}
                {unmatchedList.map(([hexId, item]) => {
                    const checked = (autoCreate[entityKey] ?? []).includes(hexId)
                    return (
                        <div
                            key={hexId}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors",
                                checked
                                    ? "bg-amber-50 dark:bg-amber-950/20"
                                    : "bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30"
                            )}
                            onClick={() => onToggle(entityKey, hexId, !checked)}
                        >
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onToggle(entityKey, hexId, e.target.checked)}
                                className="shrink-0 h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            />
                            <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                            <span className="truncate">{item.xml_name}</span>
                            <span className={cn("ml-auto text-xs shrink-0", checked ? "text-amber-600 dark:text-amber-400 font-medium" : "text-red-500")}>
                                {checked ? "Buat baru" : "Tidak ditemukan"}
                            </span>
                        </div>
                    )
                })}
                {total === 0 && (
                    <div className="px-3 py-2 text-muted-foreground text-xs italic">Tidak ada data</div>
                )}
            </div>
            {unmatchedList.length > 0 && (
                <p className="text-xs text-muted-foreground">
                    {selectedCount > 0
                        ? <span className="text-amber-600 dark:text-amber-400 font-medium">{selectedCount} dipilih untuk dibuat otomatis.</span>
                        : "Centang baris merah untuk membuat data baru secara otomatis saat import."
                    }
                </p>
            )}
        </div>
    )
}

// ---- Main Component -------------------------------------------------------

export default function JadwalPelajaranPage() {
    const [activePlanFeatures, setActivePlanFeatures] = useState<Record<string, boolean>>({})
    const canImportSchedule = activePlanFeatures['import_schedule'] === true
    const canGenerateSchedule = activePlanFeatures['algorithmic_schedule_generator'] !== false // Assuming default true for now, adapt if needed

    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
    const [selectedYearId, setSelectedYearId] = useState<string>("")

    const [xmlFile, setXmlFile] = useState<File | null>(null)
    const [isPreviewing, setIsPreviewing] = useState(false)
    const [isConfirming, setIsConfirming] = useState(false)
    const [preview, setPreview] = useState<PreviewData | null>(null)
    const [autoCreate, setAutoCreate] = useState<AutoCreate>({ subjects: [], classrooms: [], teachers: [] })

    const [schedules, setSchedules] = useState<Schedule[]>([])
    const [isLoadingSchedules, setIsLoadingSchedules] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [isLocking, setIsLocking] = useState(false)
    const [confirmReset, setConfirmReset] = useState(false)

    // ---- Generator State -------------------------------------------------
    type GenerateState = "idle" | "generating" | "preview"
    const [generateState, setGenerateState] = useState<GenerateState>("idle")
    const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null)
    const [isCommitting, setIsCommitting] = useState(false)
    const [activeTab, setActiveTab] = useState("import")

    // ---- Monitoring State -------------------------------------------------
    const [monitoringDate, setMonitoringDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
    const [monitoringData, setMonitoringData] = useState<MonitoringRecord[]>([])
    const [isLoadingMonitoring, setIsLoadingMonitoring] = useState(false)
    const [shortenedPeriodDays, setShortenedPeriodDays] = useState<ShortenedPeriodDay[]>([])
    const [defaultPeriodDuration, setDefaultPeriodDuration] = useState<number>(45)

    // Compute week dates (Monday to Friday) based on selected monitoringDate
    const weekStart = startOfWeek(parseISO(monitoringDate), { weekStartsOn: 1 }) // Monday
    const weekDates = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i))

    // ---- Fetch data -------------------------------------------------------

    useEffect(() => {
        api.get("/academic-years").then(res => {
            const years: AcademicYear[] = res.data.data || []
            setAcademicYears(years)
            const active = years.find(y => y.is_active)
            if (active) setSelectedYearId(String(active.id))
        })
        // Load schedule settings
        api.get("/settings").then(res => {
            const scheduleSettings = res.data.data?.schedule || {}
            setShortenedPeriodDays(parseShortenedDays(scheduleSettings.shortened_period_days))
            setDefaultPeriodDuration(parseInt(scheduleSettings.default_period_duration_minutes) || 45)
        }).catch(() => { /* silent fail */ })

        // Load features
        api.get("/auth/me").then(res => {
            setActivePlanFeatures(res.data.features || {})
        }).catch(() => { /* silent fail */ })
    }, [])

    const fetchSchedules = useCallback(async () => {
        if (!selectedYearId) return
        setIsLoadingSchedules(true)
        try {
            const res = await api.get("/schedules", { params: { academic_year_id: selectedYearId } })
            setSchedules(mergeConsecutiveSchedules((res.data.data || []) as Schedule[]))
        } catch {
            toast.error("Gagal memuat jadwal")
        } finally {
            setIsLoadingSchedules(false)
        }
    }, [selectedYearId])

    useEffect(() => { fetchSchedules() }, [fetchSchedules])

    const fetchMonitoring = useCallback(async () => {
        if (!selectedYearId || !monitoringDate) return
        setIsLoadingMonitoring(true)

        const start = format(weekDates[0], "yyyy-MM-dd")
        const end = format(weekDates[4], "yyyy-MM-dd")

        try {
            const res = await api.get("/journal-monitoring", {
                params: {
                    academic_year_id: selectedYearId,
                    start_date: start,
                    end_date: end
                }
            })
            setMonitoringData(res.data.data || [])
        } catch {
            toast.error("Gagal memuat data monitoring")
        } finally {
            setIsLoadingMonitoring(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYearId, monitoringDate])

    useEffect(() => {
        // Only fetch monitoring if that tab is active (will handle tab logic in JSX)
        // For simplicity, we can just fetch it when dependencies change if they are ready
        fetchMonitoring()
    }, [fetchMonitoring])

    // ---- Auto-create toggle -----------------------------------------------

    const handleToggle = (key: keyof AutoCreate, hexId: string, checked: boolean) => {
        setAutoCreate(prev => ({
            ...prev,
            [key]: checked
                ? [...prev[key], hexId]
                : prev[key].filter(id => id !== hexId),
        }))
    }

    // ---- Generator handlers -----------------------------------------------

    const DAYS_LABEL = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]

    const handleGenerate = async () => {
        if (!selectedYearId) {
            toast.error("Pilih tahun ajaran terlebih dahulu")
            return
        }
        setGenerateState("generating")
        setGenerateResult(null)
        try {
            const res = await api.post("/schedule/generate", { academic_year_id: Number(selectedYearId) })
            setGenerateResult(res.data.data)
            setGenerateState("preview")
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            toast.error(msg || "Gagal melakukan generate jadwal")
            setGenerateState("idle")
        }
    }

    const handleCommit = async () => {
        if (!selectedYearId || !generateResult) return
        setIsCommitting(true)
        try {
            const res = await api.post("/schedule/generate/commit", {
                academic_year_id: Number(selectedYearId),
                preview: generateResult.preview,
            })
            toast.success(res.data.message || "Jadwal berhasil disimpan!")
            setGenerateState("idle")
            setGenerateResult(null)
            fetchSchedules()
            setActiveTab("jadwal")
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            toast.error(msg || "Gagal menyimpan jadwal")
        } finally {
            setIsCommitting(false)
        }
    }

    // ---- Reset handler ---------------------------------------------------

    const handleReset = async () => {
        if (!confirmReset) { setConfirmReset(true); return }
        setIsResetting(true)
        try {
            const res = await api.delete("/schedules", { params: { academic_year_id: selectedYearId } })
            toast.success(res.data.message || "Jadwal berhasil direset.")
            setSchedules([])
            setConfirmReset(false)
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            toast.error(msg || "Gagal mereset jadwal")
        } finally {
            setIsResetting(false)
        }
    }

    // ---- Lock handler ---------------------------------------------------

    const handleToggleLock = async () => {
        if (!selectedYearId || !selectedYearObj) return
        setIsLocking(true)
        try {
            const res = await api.put(`/academic-years/${selectedYearId}/toggle-schedule-lock`)
            toast.success(res.data.message)

            // Update local state without refetching everything
            setAcademicYears(prev => prev.map(y =>
                y.id === Number(selectedYearId)
                    ? { ...y, is_schedule_locked: res.data.data.is_schedule_locked }
                    : y
            ))
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            toast.error(msg || "Gagal mengubah status kunci jadwal")
        } finally {
            setIsLocking(false)
        }
    }

    // ---- Import handlers --------------------------------------------------

    const handlePreview = async () => {
        if (!xmlFile || !selectedYearId) {
            toast.error("Pilih file XML dan tahun ajaran terlebih dahulu")
            return
        }
        setIsPreviewing(true)
        setPreview(null)
        setAutoCreate({ subjects: [], classrooms: [], teachers: [] })

        const form = new FormData()
        form.append("file", xmlFile)
        form.append("academic_year_id", selectedYearId)

        try {
            const res = await api.post("/schedule-imports/preview", form)
            setPreview(res.data.data)
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            toast.error(msg || "Gagal memproses file XML")
        } finally {
            setIsPreviewing(false)
        }
    }

    const handleConfirm = async () => {
        if (!xmlFile || !selectedYearId) return

        setIsConfirming(true)
        const form = new FormData()
        form.append("file", xmlFile)
        form.append("academic_year_id", selectedYearId)

        // Append auto_create arrays
        autoCreate.subjects.forEach(id => form.append("auto_create[subjects][]", id))
        autoCreate.classrooms.forEach(id => form.append("auto_create[classrooms][]", id))
        autoCreate.teachers.forEach(id => form.append("auto_create[teachers][]", id))

        try {
            const res = await api.post("/schedule-imports/confirm", form)
            toast.success(res.data.message || "Jadwal berhasil diimpor!")
            setPreview(null)
            setXmlFile(null)
            setAutoCreate({ subjects: [], classrooms: [], teachers: [] })
            fetchSchedules()
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            toast.error(msg || "Gagal mengimpor jadwal")
        } finally {
            setIsConfirming(false)
        }
    }

    // ---- Schedule view helpers -------------------------------------------

    const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]
    const PERIODS = Array.from({ length: 10 }, (_, i) => i + 1)

    function getScheduleCell(day: number, period: number) {
        return schedules.filter(
            s => s.day_of_week === day && s.period_start === period
        )
    }

    // ---- Computed stats ---------------------------------------------------

    const totalAutoCreate = autoCreate.subjects.length + autoCreate.classrooms.length + autoCreate.teachers.length
    const selectedYearObj = academicYears.find(y => y.id === Number(selectedYearId))
    const isLocked = !!selectedYearObj?.is_schedule_locked

    // ---- Render -----------------------------------------------------------

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Jurnal Mapel</h1>
                <p className="text-muted-foreground">Impor dan kelola jadwal pelajaran mingguan</p>
            </div>

            <div className="flex items-center gap-3 w-full max-w-xs">
                <Label className="shrink-0">Tahun Ajaran</Label>
                <Select value={selectedYearId} onValueChange={setSelectedYearId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih tahun ajaran" />
                    </SelectTrigger>
                    <SelectContent>
                        {academicYears.map(y => (
                            <SelectItem key={y.id} value={String(y.id)}>
                                {y.name} {y.is_active && <span className="text-emerald-500">(Aktif)</span>}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Tabs value={activeTab} onValueChange={v => generateState !== "generating" && setActiveTab(v)}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="import" className="gap-1.5" disabled={generateState === "generating" || !canImportSchedule}>
                        <Upload className="h-4 w-4" /> Import Jadwal
                    </TabsTrigger>
                    <TabsTrigger value="generate" className="gap-1.5" disabled={generateState === "generating" || !canGenerateSchedule}>
                        <Zap className="h-4 w-4" /> Generate Jadwal
                    </TabsTrigger>
                    <TabsTrigger value="jadwal" className="gap-1.5" disabled={generateState === "generating"}>
                        <Clock className="h-4 w-4" /> Lihat Jadwal
                    </TabsTrigger>
                    <TabsTrigger value="monitoring" className="gap-1.5" disabled={generateState === "generating"}>
                        <AlertTriangle className="h-4 w-4" /> Monitoring Jurnal
                    </TabsTrigger>
                </TabsList>

                {/* ---- Import Tab ---------------------------------------- */}
                <TabsContent value="import" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Import dari ASC TimeTable</CardTitle>
                            <CardDescription>
                                Upload file XML dari ASC TimeTable. Cocokkan nama guru, mapel, dan kelas dengan database.
                                Data yang belum ada bisa dibuat otomatis.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!canImportSchedule ? (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-6 text-center text-amber-800 dark:text-amber-400">
                                    <AlertTriangle className="h-8 w-8 mx-auto mb-3" />
                                    <h3 className="font-semibold text-lg mb-1">Fitur Terkunci (Perintis)</h3>
                                    <p className="text-sm max-w-md mx-auto">
                                        Fitur Import Jadwal dari aplikasi ASC TimeTable hanya tersedia mulai dari paket <strong>Perintis</strong>.
                                        Silakan upgrade paket langganan Anda untuk menggunakan fitur ini.
                                    </p>
                                </div>
                            ) : schedules.length > 0 ? (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-6 text-center text-amber-800 dark:text-amber-400">
                                    <AlertTriangle className="h-8 w-8 mx-auto mb-3" />
                                    <h3 className="font-semibold text-lg mb-1">Jadwal Sudah Aktif</h3>
                                    <p className="text-sm max-w-md mx-auto">
                                        Tidak dapat melakukan import karena jadwal untuk tahun ajaran ini sudah ada.
                                        Silakan reset jadwal pada tab <strong>Lihat Jadwal</strong> terlebih dahulu jika ingin mengimpor ulang.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* File picker */}
                                    <div
                                        className={cn(
                                            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                                            xmlFile
                                                ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
                                                : "border-muted-foreground/30 hover:border-primary/50"
                                        )}
                                        onClick={() => document.getElementById("xml-upload")?.click()}
                                    >
                                        <input
                                            id="xml-upload"
                                            type="file"
                                            accept=".xml"
                                            className="hidden"
                                            onChange={e => {
                                                setXmlFile(e.target.files?.[0] ?? null)
                                                setPreview(null)
                                                setAutoCreate({ subjects: [], classrooms: [], teachers: [] })
                                            }}
                                        />
                                        {xmlFile ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                                <span className="text-sm font-medium">{xmlFile.name}</span>
                                                <span className="text-xs text-muted-foreground">Klik untuk ganti file</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1">
                                                <Upload className="h-8 w-8 text-muted-foreground" />
                                                <span className="text-sm font-medium">Klik untuk memilih file XML</span>
                                                <span className="text-xs text-muted-foreground">Format: .xml dari ASC TimeTable</span>
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        onClick={handlePreview}
                                        disabled={!xmlFile || !selectedYearId || isPreviewing}
                                        className="w-full"
                                        variant="outline"
                                    >
                                        {isPreviewing
                                            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Menganalisis...</>
                                            : "Pratinjau Pencocokan Nama"
                                        }
                                    </Button>

                                    {/* Preview result */}
                                    {preview && (
                                        <div className="space-y-4 pt-2">
                                            {/* Summary banner */}
                                            <div className={cn(
                                                "flex items-start gap-3 rounded-lg p-4 border",
                                                preview.cards_importable > 0
                                                    ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                                                    : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                                            )}>
                                                {preview.cards_importable > 0
                                                    ? <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                                                    : <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                                                }
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {preview.cards_importable} slot jadwal siap diimpor
                                                        {preview.cards_skipped > 0 && `, ${preview.cards_skipped} belum cocok`}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        Centang baris merah di bawah untuk membuat data yang belum ada secara otomatis — lalu klik Konfirmasi.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Match tables */}
                                            <div className="space-y-4">
                                                <MatchSection icon={Users} label="Guru" entityKey="teachers" group={preview.teachers} autoCreate={autoCreate} onToggle={handleToggle} />
                                                <MatchSection icon={BookOpen} label="Mata Pelajaran" entityKey="subjects" group={preview.subjects} autoCreate={autoCreate} onToggle={handleToggle} />
                                                <MatchSection icon={School} label="Kelas" entityKey="classrooms" group={preview.classrooms} autoCreate={autoCreate} onToggle={handleToggle} />
                                            </div>

                                            {/* Confirm button */}
                                            <Button
                                                onClick={handleConfirm}
                                                disabled={(preview.cards_importable === 0 && totalAutoCreate === 0) || isConfirming}
                                                className="w-full"
                                            >
                                                {isConfirming
                                                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Mengimpor...</>
                                                    : `Konfirmasi Import${totalAutoCreate > 0 ? ` + Buat ${totalAutoCreate} Data Baru` : ""}`
                                                }
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ---- Generate Jadwal Tab ------------------------------- */}
                <TabsContent value="generate" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Generate Jadwal Otomatis</CardTitle>
                            <CardDescription>
                                Buat jadwal mingguan secara otomatis menggunakan algoritma greedy berdasarkan data kurikulum.
                                Pastikan data kurikulum sudah dikonfigurasi di halaman{" "}
                                <strong>Kurikulum</strong> terlebih dahulu.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!canGenerateSchedule ? (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-6 text-center text-amber-800 dark:text-amber-400">
                                    <AlertTriangle className="h-8 w-8 mx-auto mb-3" />
                                    <h3 className="font-semibold text-lg mb-1">Fitur Terkunci</h3>
                                    <p className="text-sm max-w-md mx-auto">
                                        Fitur Auto-Generate Jadwal tidak tersedia pada paket langganan Anda saat ini.
                                    </p>
                                </div>
                            ) : schedules.length > 0 ? (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-6 text-center text-amber-800 dark:text-amber-400">
                                    <AlertTriangle className="h-8 w-8 mx-auto mb-3" />
                                    <h3 className="font-semibold text-lg mb-1">Jadwal Sudah Aktif</h3>
                                    <p className="text-sm max-w-md mx-auto">
                                        Tidak dapat meng-generate jadwal baru karena jadwal tahun ajaran ini sudah terisi.
                                        Silakan reset jadwal pada tab <strong>Lihat Jadwal</strong> terlebih dahulu jika ingin mengganti jadwal keseluruhan.
                                    </p>
                                </div>
                            ) : generateState === "idle" && (
                                <div className="flex flex-col items-center gap-4 py-10 text-center">
                                    <div className="rounded-full bg-primary/10 p-4">
                                        <Zap className="h-8 w-8 text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium">Belum ada jadwal yang di-generate</p>
                                        <p className="text-sm text-muted-foreground max-w-sm">
                                            Klik tombol di bawah untuk memulai proses generate.
                                            Hasil akan ditampilkan sebagai pratinjau sebelum disimpan.
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 max-w-sm text-left">
                                        ⚠️ <strong>Perhatian:</strong> Pastikan data kurikulum (jam sekolah, mata pelajaran per kelas) sudah dikonfigurasi sebelum generate.
                                    </div>
                                    <Button onClick={handleGenerate} disabled={!selectedYearId} className="gap-2">
                                        <Zap className="h-4 w-4" /> Mulai Generate
                                    </Button>
                                </div>
                            )}

                            {generateState === "generating" && (
                                <div className="flex flex-col items-center gap-4 py-16 text-center">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                    <div className="space-y-1">
                                        <p className="font-semibold text-lg">Sedang membuat jadwal...</p>
                                        <p className="text-sm text-muted-foreground">
                                            Proses ini mungkin memakan beberapa detik. Jangan tutup halaman ini.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {generateState === "preview" && generateResult && (
                                <div className="space-y-4">
                                    {/* Summary */}
                                    <div className="flex items-center gap-3 rounded-lg border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 px-4 py-3">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                        <div>
                                            <p className="font-medium text-sm">
                                                {generateResult.total} slot jadwal berhasil dibuat
                                            </p>
                                            {generateResult.unresolved_count > 0 && (
                                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                                    {generateResult.unresolved_count} item tidak bisa ditempatkan (lihat peringatan di bawah).
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Unresolved warnings */}
                                    {generateResult.unresolved_count > 0 && (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3 space-y-1">
                                            <p className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                                <AlertTriangle className="h-4 w-4" /> Item tidak bisa dijadwalkan:
                                            </p>
                                            <ul className="text-xs text-amber-600 dark:text-amber-500 space-y-0.5 pl-4">
                                                {generateResult.unresolved.map((u, i) => (
                                                    <li key={i}>• {u.classroom} — {u.subject} ({u.teacher})</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Preview table */}
                                    <div className="overflow-x-auto rounded-md border">
                                        <table className="w-full text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-muted">
                                                    <th className="border p-2 text-left">Kelas</th>
                                                    <th className="border p-2 text-left">Mata Pelajaran</th>
                                                    <th className="border p-2 text-left">Guru</th>
                                                    <th className="border p-2 text-center">Hari</th>
                                                    <th className="border p-2 text-center">Jam ke-</th>
                                                    <th className="border p-2 text-center">Waktu</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {generateResult.preview.map((item, i) => (
                                                    <tr key={i} className="hover:bg-muted/30">
                                                        <td className="border p-1.5">{item.classroom}</td>
                                                        <td className="border p-1.5">{item.subject}</td>
                                                        <td className="border p-1.5 text-muted-foreground">{item.teacher}</td>
                                                        <td className="border p-1.5 text-center">{DAYS_LABEL[item.day_of_week - 1]}</td>
                                                        <td className="border p-1.5 text-center">{item.period_start}</td>
                                                        <td className="border p-1.5 text-center">{item.start_time?.slice(0, 5)} – {item.end_time?.slice(0, 5)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3">
                                        <Button
                                            onClick={handleCommit}
                                            disabled={isCommitting}
                                            className="gap-1.5"
                                        >
                                            {isCommitting
                                                ? <><Loader2 className="h-4 w-4 animate-spin" />Menyimpan...</>
                                                : <><CheckCircle2 className="h-4 w-4" />Simpan Jadwal</>
                                            }
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => { setGenerateState("idle"); setGenerateResult(null) }}
                                            disabled={isCommitting}
                                        >
                                            Batal
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ---- Lihat Jadwal Tab ---------------------------------- */}
                <TabsContent value="jadwal">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Jadwal Mingguan</CardTitle>
                                    <CardDescription>
                                        Semua slot jadwal yang telah diimpor untuk tahun ajaran yang dipilih.
                                    </CardDescription>
                                </div>
                                {schedules.length > 0 && selectedYearObj && (
                                    <div className="flex items-center gap-2">

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleToggleLock}
                                            disabled={isLocking}
                                            className={cn(isLocked && "border-amber-500 text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-900/40")}
                                        >
                                            {isLocking ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                            ) : isLocked ? (
                                                <>🔒 Buka Kunci</>
                                            ) : (
                                                <>🔓 Kunci Jadwal</>
                                            )}
                                        </Button>

                                        {!isLocked && (
                                            <>
                                                {confirmReset && (
                                                    <span className="text-xs text-red-500 font-medium">
                                                        Jurnal terkait juga ikut terhapus!
                                                    </span>
                                                )}
                                                <Button
                                                    variant={confirmReset ? "destructive" : "outline"}
                                                    size="sm"
                                                    onClick={confirmReset ? handleReset : () => setConfirmReset(true)}
                                                    disabled={isResetting}
                                                    onBlur={() => setTimeout(() => setConfirmReset(false), 300)}
                                                >
                                                    {isResetting
                                                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Menghapus...</>
                                                        : confirmReset
                                                            ? "Yakin? Klik lagi untuk hapus"
                                                            : "Reset Jadwal"
                                                    }
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoadingSchedules ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : schedules.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">Belum ada jadwal diimpor untuk tahun ajaran ini.</p>
                                    <p className="text-xs mt-1">Gunakan tab <strong>Import Jadwal</strong> untuk memulai.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs border-collapse">
                                        <thead>
                                            <tr>
                                                <th className="border p-2 bg-muted text-left w-16">Jam</th>
                                                {DAYS.map(d => (
                                                    <th key={d} className="border p-2 bg-muted text-center">{d}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {PERIODS.map(p => (
                                                <tr key={p}>
                                                    <td className="border p-2 text-center font-medium text-muted-foreground">{p}</td>
                                                    {[1, 2, 3, 4, 5].map(day => {
                                                        const cells = getScheduleCell(day, p)
                                                        return (
                                                            <td key={day} className="border p-1 align-top min-w-[120px]">
                                                                {cells.map((s, i) => (
                                                                    <div key={i} className="rounded text-[11px] p-1 mb-0.5 bg-primary/10 leading-tight">
                                                                        <div className="font-semibold">{s.subject?.name}</div>
                                                                        <div className="text-muted-foreground">{s.classroom?.name}</div>
                                                                        <div className="text-muted-foreground">{s.teacher?.name}</div>
                                                                        {s.period_end > s.period_start && (
                                                                            <div className="mt-0.5 text-[10px] text-primary/70 font-medium">Jam {s.period_start}-{s.period_end}</div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ---- Monitoring Jurnal Tab ----------------------------- */}
                <TabsContent value="monitoring">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Monitoring Jurnal Guru</CardTitle>
                                    <CardDescription>
                                        Pantau kepatuhan dan ketepatan waktu pengisian jurnal per minggu.
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label className="text-sm whitespace-nowrap">Pilih Minggu:</Label>
                                    <input
                                        type="date"
                                        value={monitoringDate}
                                        onChange={(e) => setMonitoringDate(e.target.value)}
                                        className="h-9 w-40 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoadingMonitoring ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : monitoringData.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground border rounded-lg">
                                    <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">Belum ada guru di tahun ajaran ini.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto border rounded-xl shadow-sm">
                                    <table className="w-full text-sm border-collapse bg-card">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="p-3 text-left font-semibold min-w-[200px] border-r">Nama Guru</th>
                                                {weekDates.map((date, i) => (
                                                    <th key={i} className="p-3 text-center border-r font-medium min-w-[180px]">
                                                        <div>{format(date, "EEEE", { locale: id })}</div>
                                                        <div className="text-xs text-muted-foreground font-normal">{format(date, "dd MMM yyyy", { locale: id })}</div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {monitoringData.map((record) => (
                                                <tr key={record.teacher_id} className="hover:bg-muted/10 transition-colors">
                                                    <td className="p-3 border-r align-top">
                                                        <div className="font-semibold">{record.name}</div>
                                                        {record.nip && <div className="text-xs text-muted-foreground">NIP. {record.nip}</div>}
                                                    </td>
                                                    {weekDates.map((date, i) => {
                                                        const targetDow = date.getDay() || 7 // adjust Sun to 7, Mon=1...
                                                        const daySchedules = mergeConsecutiveSchedules(
                                                            record.schedules.filter((s: Schedule) => s.day_of_week === targetDow)
                                                        )

                                                        return (
                                                            <td key={i} className="p-2 border-r align-top bg-dot-pattern">
                                                                {daySchedules.length === 0 ? (
                                                                    <div className="text-center text-xs text-muted-foreground py-2 opacity-50">-</div>
                                                                ) : (
                                                                    <div className="space-y-2">
                                                                        {daySchedules.map((s: Schedule) => {
                                                                            const hasJournal = !!s.journal
                                                                            const isPast = isBefore(date, new Date()) || isToday(date)
                                                                            const filledSameDay = s.journal && isSameDay(parseISO(s.journal.date), parseISO(s.journal.filled_at || s.journal.date))

                                                                            // Shortened period day override
                                                                            const dateStr = format(date, "yyyy-MM-dd")
                                                                            const shortenedDay = getShortenedDay(shortenedPeriodDays, dateStr)
                                                                            const displayTimes = shortenedDay && s.period_start
                                                                                ? computeAdjustedTimes(
                                                                                    s.start_time,
                                                                                    s.period_start,
                                                                                    s.period_end,
                                                                                    defaultPeriodDuration,
                                                                                    shortenedDay.duration_minutes
                                                                                )
                                                                                : { start_time: s.start_time, end_time: s.end_time }

                                                                            let StatusBadge = null
                                                                            let borderColor = "border-border"

                                                                            if (!hasJournal) {
                                                                                if (isPast) {
                                                                                    StatusBadge = <Badge variant="destructive" className="h-5 text-[10px]">Belum Diisi</Badge>
                                                                                    borderColor = "border-red-200 dark:border-red-900/50"
                                                                                } else {
                                                                                    StatusBadge = <Badge variant="outline" className="h-5 text-[10px] bg-muted/50">Jadwal</Badge>
                                                                                }
                                                                            } else {
                                                                                if (filledSameDay) {
                                                                                    StatusBadge = <Badge className="h-5 text-[10px] bg-emerald-500 hover:bg-emerald-600">Tepat Waktu</Badge>
                                                                                    borderColor = "border-emerald-200 dark:border-emerald-900/50"
                                                                                } else {
                                                                                    StatusBadge = <Badge variant="secondary" className="h-5 text-[10px] bg-amber-500 hover:bg-amber-600 text-white border-transparent">Terlambat</Badge>
                                                                                    borderColor = "border-amber-200 dark:border-amber-900/50"
                                                                                }
                                                                            }

                                                                            const hasAlpha = hasJournal && s.journal?.attendance && s.journal?.attendance.alpha > 0

                                                                            return (
                                                                                <Tooltip key={s.id}>
                                                                                    <TooltipTrigger asChild>
                                                                                        <div className={cn("p-2 rounded-md border bg-card text-xs shadow-sm flex items-center justify-between gap-2 cursor-help transition-colors hover:bg-muted/50 relative", borderColor)}>
                                                                                            {hasAlpha && <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_0_2px_hsl(var(--background))]" title="Ada siswa Alpha" />}
                                                                                            <span className="font-bold text-[13px] tracking-tight whitespace-nowrap">{s.classroom?.short || s.classroom?.name}</span>
                                                                                            <div className="shrink-0">{StatusBadge}</div>
                                                                                        </div>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent side="right" align="start" className="w-[260px] p-3 space-y-2 bg-popover text-popover-foreground border shadow-md">
                                                                                        <div className="font-semibold text-sm leading-tight">
                                                                                            {s.subject?.name}
                                                                                            {s.period_end > s.period_start && (
                                                                                                <span className="ml-1.5 opacity-70 font-normal text-xs">
                                                                                                    (Jam {s.period_start}-{s.period_end})
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                        {shortenedDay && (
                                                                                            <div className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded-full w-fit">
                                                                                                <Timer className="h-2.5 w-2.5" />
                                                                                                {shortenedDay.label} — {shortenedDay.duration_minutes} menit/jam
                                                                                            </div>
                                                                                        )}
                                                                                        <div className="flex justify-between items-center text-xs text-muted-foreground bg-muted/30 p-1.5 rounded-md">
                                                                                            <span>{s.classroom?.name}</span>
                                                                                            <span className={cn("font-medium", shortenedDay && "text-amber-600 dark:text-amber-400")}>
                                                                                                {displayTimes.start_time} - {displayTimes.end_time}
                                                                                                {shortenedDay && <span className="ml-1 opacity-60 line-through text-[10px]">{s.start_time} - {s.end_time}</span>}
                                                                                            </span>
                                                                                        </div>
                                                                                        {hasJournal && s.journal?.topic && (
                                                                                            <div className="pt-2 mt-2 border-t border-border/50 text-xs">
                                                                                                <span className="font-medium text-muted-foreground block mb-0.5">Topik/Materi:</span>
                                                                                                <span className="leading-relaxed">{s.journal?.topic}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {hasJournal && s.journal?.notes && (
                                                                                            <div className="pt-2 mt-2 border-t border-border/50 text-xs text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
                                                                                                <span className="font-medium block mb-0.5">Catatan:</span>
                                                                                                <span className="leading-relaxed">{s.journal?.notes}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {hasJournal && s.journal?.homework && (
                                                                                            <div className="pt-2 mt-2 border-t border-border/50 text-xs text-blue-700 dark:text-blue-500 bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                                                                                                <span className="font-medium block mb-0.5">Tugas/PR:</span>
                                                                                                <span className="leading-relaxed">{s.journal?.homework}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {hasJournal && s.journal?.attendance && (
                                                                                            <div className="pt-2 mt-2 border-t border-border/50 flex gap-1.5 flex-wrap">
                                                                                                <Badge variant="outline" className="text-[10px] h-5 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
                                                                                                    H: {s.journal?.attendance.hadir}
                                                                                                </Badge>
                                                                                                {s.journal?.attendance.sakit > 0 && (
                                                                                                    <Badge variant="outline" className="text-[10px] h-5 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
                                                                                                        S: {s.journal?.attendance.sakit}
                                                                                                    </Badge>
                                                                                                )}
                                                                                                {s.journal?.attendance.izin > 0 && (
                                                                                                    <Badge variant="outline" className="text-[10px] h-5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800">
                                                                                                        I: {s.journal?.attendance.izin}
                                                                                                    </Badge>
                                                                                                )}
                                                                                                {s.journal?.attendance.alpha > 0 && (
                                                                                                    <Badge variant="outline" className="text-[10px] h-5 bg-red-50 text-red-700 border-red-200 font-bold dark:bg-red-950/30 dark:text-red-400 dark:border-red-800">
                                                                                                        A: {s.journal?.attendance.alpha}
                                                                                                    </Badge>
                                                                                                )}
                                                                                            </div>
                                                                                        )}
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
