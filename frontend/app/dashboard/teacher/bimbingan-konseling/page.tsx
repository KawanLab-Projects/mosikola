"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertCircle, Users, Activity, HeartHandshake, Plus, Sparkles, Printer } from "lucide-react"
import { api } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import CounselingSessionModal from "./CounselingSessionModal"
import AiRecommendationModal from "./AiRecommendationModal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface StudentBK {
    id: number;
    public_id: string;
    name: string;
    nisn: string;
    classroom?: {
        name: string;
    };
    violations_sum_point: number;
}

interface CounselingSession {
    id: number;
    student?: {
        name: string;
    };
    topic: string;
    notes: string;
    counseling_date: string;
    status: 'open' | 'follow_up_needed' | 'resolved';
}

interface TeacherAssignment {
    assignment_type: string;
}

interface UserAuthPayload {
    user: {
        teacher?: {
            assignments?: TeacherAssignment[];
        };
    };
    features?: {
        ai_counseling?: boolean;
    };
    tenant_settings?: {
        discipline?: {
            action_threshold_sp1?: string;
            action_threshold_sp2?: string;
            action_threshold_parent_call?: string;
            action_threshold_suspension?: string;
        };
    };
}

export default function BimbinganKonselingPage() {
    const [isSessionModalOpen, setIsSessionModalOpen] = useState(false)
    const [selectedStudentForSession, setSelectedStudentForSession] = useState<StudentBK | undefined>(undefined)
    const [isAiModalOpen, setIsAiModalOpen] = useState(false)
    const [selectedStudentForAi, setSelectedStudentForAi] = useState<StudentBK | undefined>(undefined)

    // Letter Print State
    const [isLetterModalOpen, setIsLetterModalOpen] = useState(false)
    const [letterProps, setLetterProps] = useState<{ studentId: string, type: string } | null>(null)
    const [customLetterNumber, setCustomLetterNumber] = useState("")

    const { data: userAuthPayload, isLoading: userLoading } = useQuery<UserAuthPayload>({
        queryKey: ["auth-me-teacher-check"],
        queryFn: async () => {
            const res = await api.get("/auth/me")
            return res.data
        },
    })

    const user = userAuthPayload?.user
    const features = userAuthPayload?.features
    const tenantSettings = userAuthPayload?.tenant_settings

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["bk-dashboard-stats"],
        queryFn: async () => {
            const res = await api.get("/bk/dashboard-stats")
            return res.data
        },
        enabled: !!user,
    })

    const { data: needsAttentionData, isLoading: attentionLoading } = useQuery<StudentBK[]>({
        queryKey: ["bk-needs-attention"],
        queryFn: async () => {
            const res = await api.get("/bk/needs-attention?limit=5")
            return res.data.data
        },
        enabled: !!user,
    })

    const { data: recentSessions, isLoading: sessionsLoading } = useQuery<CounselingSession[]>({
        queryKey: ["bk-recent-sessions"],
        queryFn: async () => {
            const res = await api.get("/bk/counseling-sessions?limit=5")
            return res.data.data // Assuming paginated response has data array
        },
        enabled: !!user,
    })

    if (userLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
        )
    }

    // Check if user has guru_bk assignment
    const isGuruBK = user?.teacher?.assignments?.some(
        (assignment: TeacherAssignment) => assignment.assignment_type === "guru_bk"
    )

    if (!isGuruBK) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6 space-y-4">
                <div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                    <AlertCircle className="h-10 w-10" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">Akses Ditolak</h1>
                <p className="text-muted-foreground text-base max-w-sm">Halaman ini khusus untuk guru yang ditugaskan sebagai Guru Bimbingan Konseling (BK). Anda tidak memiliki akses ke halaman ini.</p>
            </div>
        )
    }

    const handleOpenSessionModal = (student?: StudentBK) => {
        setSelectedStudentForSession(student || undefined)
        setIsSessionModalOpen(true)
    }

    const handleOpenAiModal = (student: StudentBK) => {
        setSelectedStudentForAi(student)
        setIsAiModalOpen(true)
    }

    const openLetterModal = (studentId: string, type: string) => {
        setLetterProps({ studentId, type })
        setCustomLetterNumber("")
        setIsLetterModalOpen(true)
    }

    const handleProceedPrint = () => {
        if (!letterProps) return
        const url = `/dashboard/teacher/bimbingan-konseling/print-surat?student_id=${letterProps.studentId}&type=${letterProps.type}&number=${encodeURIComponent(customLetterNumber)}`
        window.open(url, "_blank")
        setIsLetterModalOpen(false)
    }

    const hasAiCounseling = features?.ai_counseling === true

    // Prepare thresholds
    const tsSp1 = parseInt(tenantSettings?.discipline?.action_threshold_sp1 || "25")
    const tsSp2 = parseInt(tenantSettings?.discipline?.action_threshold_sp2 || "50")
    const tsParentCall = parseInt(tenantSettings?.discipline?.action_threshold_parent_call || "75")
    const tsSuspension = parseInt(tenantSettings?.discipline?.action_threshold_suspension || "100")

    return (
        <div className="flex-1 space-y-6 p-8">
            <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard Bimbingan Konseling</h2>
                    <p className="text-muted-foreground">
                        Pantau kedisiplinan dan kesejahteraan siswa di kelas yang Anda ampu.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/teacher/piket">
                        <Button variant="outline">Input Pelanggaran/Prestasi (Piket)</Button>
                    </Link>
                    <Button onClick={() => handleOpenSessionModal()} className="gap-2">
                        <Plus className="h-4 w-4" /> Catat Konseling Baru
                    </Button>
                </div>
            </div>

            {/* Top Row: Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Siswa Berisiko Tinggi</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {statsLoading ? "..." : stats?.high_risk_count || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Siswa dengan poin &gt; 30</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Intervensi Bulan Ini</CardTitle>
                        <HeartHandshake className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {statsLoading ? "..." : stats?.interventions_count || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Total sesi konseling</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Momentum Positif</CardTitle>
                        <Activity className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {statsLoading ? "..." : stats?.positive_momentum_count || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Siswa yang mencatat perilaku positif</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                {/* Needs Attention Sidebar */}
                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle>Perlu Perhatian Khusus</CardTitle>
                        <CardDescription>Siswa dengan poin pelanggaran tertinggi</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {attentionLoading ? (
                            <div className="flex justify-center p-4"><div className="animate-pulse h-4 w-24 bg-slate-200 rounded"></div></div>
                        ) : needsAttentionData && needsAttentionData.length > 0 ? (
                            <div className="space-y-4">
                                {needsAttentionData.map((student: StudentBK, idx: number) => (
                                    <div key={student.public_id || idx} className="flex items-center justify-between space-x-4 border-b pb-4 last:border-0 last:pb-0">
                                        <div className="flex flex-col">
                                            <p className="font-medium text-sm leading-none">{student.name}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Kelas: {student.classroom?.name || "-"}</p>

                                            {/* Action thresholds badge cluster */}
                                            {student.violations_sum_point >= tsSp1 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {student.violations_sum_point >= tsSp1 && student.violations_sum_point < tsSp2 && (
                                                        <span onClick={() => openLetterModal(String(student.public_id || student.id), 'sp1')} className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded cursor-pointer hover:bg-amber-200 inline-flex items-center gap-1"><Printer className="h-3 w-3" /> SP1</span>
                                                    )}
                                                    {student.violations_sum_point >= tsSp2 && student.violations_sum_point < tsParentCall && (
                                                        <span onClick={() => openLetterModal(String(student.public_id || student.id), 'sp2')} className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded cursor-pointer hover:bg-orange-200 inline-flex items-center gap-1"><Printer className="h-3 w-3" /> SP2</span>
                                                    )}
                                                    {student.violations_sum_point >= tsParentCall && student.violations_sum_point < tsSuspension && (
                                                        <span onClick={() => openLetterModal(String(student.public_id || student.id), 'parent_call')} className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded cursor-pointer hover:bg-red-200 inline-flex items-center gap-1"><Printer className="h-3 w-3" /> Panggil Wali</span>
                                                    )}
                                                    {student.violations_sum_point >= tsSuspension && (
                                                        <span onClick={() => openLetterModal(String(student.public_id || student.id), 'suspension')} className="text-[10px] bg-black text-white px-2 py-0.5 rounded cursor-pointer hover:bg-gray-800 inline-flex items-center gap-1"><Printer className="h-3 w-3" /> Skorsing</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded">
                                                {student.violations_sum_point} Poin
                                            </div>
                                            {hasAiCounseling && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-1 border-primary/30 text-primary hover:bg-primary/10"
                                                    onClick={() => handleOpenAiModal(student)}
                                                >
                                                    <Sparkles className="h-3 w-3" />
                                                    <span className="hidden sm:inline">Rekomendasi</span> AI
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" onClick={() => handleOpenSessionModal(student)}>
                                                Konseling
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-sm text-muted-foreground">
                                Tidak ada data siswa berisiko saat ini.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Main View: Logs/Search */}
                <div className="md:col-span-4 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Riwayat Sesi Konseling Terbaru</CardTitle>
                            <CardDescription>Daftar sesi konseling yang telah dilakukan.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {sessionsLoading ? (
                                <div className="flex justify-center p-4"><div className="animate-pulse h-4 w-24 bg-slate-200 rounded"></div></div>
                            ) : recentSessions && recentSessions.length > 0 ? (
                                <div className="space-y-4">
                                    {recentSessions.map((session: CounselingSession, idx: number) => (
                                        <div key={session.id || idx} className="flex items-start justify-between border rounded-lg p-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm">{session.student?.name}</span>
                                                    <span className="text-xs bg-slate-100 px-2 rounded text-slate-600">{session.topic}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate w-[250px]">{session.notes || "Tidak ada catatan."}</p>
                                                <div className="text-xs text-slate-400">
                                                    {new Date(session.counseling_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </div>
                                            </div>
                                            <div>
                                                <span className={`text-[10px] font-medium px-2 py-1 rounded-full uppercase tracking-wider
                                                    ${session.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                                        session.status === 'follow_up_needed' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-blue-100 text-blue-700'}`}>
                                                    {session.status.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-sm text-muted-foreground flex items-center justify-center flex-col">
                                    <Users className="h-10 w-10 mb-2 opacity-20" />
                                    <p>Belum ada riwayat sesi konseling.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Action Modals */}
            <CounselingSessionModal
                isOpen={isSessionModalOpen}
                onClose={() => setIsSessionModalOpen(false)}
                prefilledStudent={selectedStudentForSession}
            />

            <AiRecommendationModal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                student={selectedStudentForAi}
            />

            {/* Letter Number Input Modal */}
            <Dialog open={isLetterModalOpen} onOpenChange={setIsLetterModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Format Nomor Surat</DialogTitle>
                        <DialogDescription>
                            Masukkan nomor surat resmi sesuai dengan format administrasi sekolah Anda. Jika dikosongkan, sistem akan mengacaknya.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="letter_number">Nomor Surat (Opsional)</Label>
                            <Input
                                id="letter_number"
                                placeholder={`Contoh: 014/BK/${new Date().getFullYear()}`}
                                value={customLetterNumber}
                                onChange={(e) => setCustomLetterNumber(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLetterModalOpen(false)}>Batal</Button>
                        <Button onClick={handleProceedPrint}>Buat & Cetak Surat</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
