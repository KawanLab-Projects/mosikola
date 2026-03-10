"use client"

import { useEffect, useState, useCallback } from "react"
import { api } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Users, Activity, ExternalLink, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AcademicYear {
    id: number
    name: string
    is_active: boolean
}

interface DashboardStudent {
    id: number
    name: string
    nisn: string
    classroom?: {
        name: string
    }
    total_points: number
    attendance_summary?: {
        sick?: number
        permission?: number
        absent?: number
    }
}

export default function GuruWaliDashboard() {
    const [students, setStudents] = useState<DashboardStudent[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
    const [selectedYear, setSelectedYear] = useState<string>("")

    const fetchConfig = useCallback(async () => {
        try {
            const res = await api.get('/academic-years')
            const years = res.data.data || []
            setAcademicYears(years)
            const active = years.find((y: AcademicYear) => y.is_active)
            if (active) setSelectedYear(String(active.id))
        } catch { /* silent */ }
    }, [])

    const fetchStudents = useCallback(async () => {
        setIsLoading(true)
        try {
            const params = selectedYear ? { academic_year_id: selectedYear } : {}
            const res = await api.get("/guru-wali/dashboard", { params })
            setStudents(res.data.data || [])
        } catch {
            setStudents([])
        } finally {
            setIsLoading(false)
        }
    }, [selectedYear])

    useEffect(() => {
        fetchConfig()
    }, [fetchConfig])

    useEffect(() => {
        if (selectedYear) fetchStudents()
    }, [selectedYear, fetchStudents])

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <GraduationCap className="h-6 w-6 text-primary" />
                        Dashboard Guru Wali
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Pantau perkembangan, kedisiplinan, dan absensi siswa binaan Anda.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[180px] bg-background">
                            <SelectValue placeholder="Tahun Ajaran" />
                        </SelectTrigger>
                        <SelectContent>
                            {academicYears.map(y => (
                                <SelectItem key={y.id} value={String(y.id)}>
                                    {y.name} {y.is_active ? "(Aktif)" : ""}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Siswa Binaan</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{students.length}</div>
                        <p className="text-xs text-muted-foreground">Siswa aktif tahun ini</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Siswa Perlu Perhatian</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">
                            {students.filter(s => (s.attendance_summary?.absent || 0) > 3 || (s.total_points || 0) < 50).length}
                        </div>
                        <p className="text-xs text-muted-foreground">Absen &gt; 3 atau Poin &lt; 50</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rata-rata Poin</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {students.length > 0
                                ? Math.round(students.reduce((acc, s) => acc + (s.total_points || 0), 0) / students.length)
                                : 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Dari seluruh siswa binaan</p>
                    </CardContent>
                </Card>
            </div>

            {/* Students List */}
            <h2 className="text-lg font-semibold tracking-tight mt-8 mb-4">Daftar Siswa Binaan</h2>
            {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader className="pb-2">
                                <div className="h-4 w-1/2 bg-muted rounded mb-2"></div>
                                <div className="h-3 w-1/3 bg-muted rounded"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-10 bg-muted rounded"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : students.length === 0 ? (
                <Card className="border-dashed bg-muted/20">
                    <CardContent className="flex flex-col items-center justify-center h-40 text-center space-y-3">
                        <Users className="h-8 w-8 text-muted-foreground opacity-50" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Tidak ada siswa binaan</p>
                            <p className="text-xs text-muted-foreground">Anda belum ditugaskan sebagai Guru Wali untuk tahun ajaran ini.</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 lg:grid-cols-3 border-t pt-4 border-dashed">
                    {students.map((student) => (
                        <Card key={student.id} className="overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-primary/50 group">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start gap-2">
                                    <div>
                                        <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors">{student.name}</CardTitle>
                                        <CardDescription className="text-xs mt-1">
                                            NISN: {student.nisn} • {student.classroom?.name || "-"}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={student.total_points >= 80 ? 'default' : student.total_points <= 50 ? 'destructive' : 'secondary'}>
                                        {student.total_points} Pts
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 text-sm space-y-4">
                                <div className="grid grid-cols-3 gap-2 text-center border rounded-md p-2 bg-muted/30">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sakit</span>
                                        <span className="font-semibold text-amber-600">{student.attendance_summary?.sick || 0}</span>
                                    </div>
                                    <div className="flex flex-col border-x">
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Izin</span>
                                        <span className="font-semibold text-blue-600">{student.attendance_summary?.permission || 0}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Alpa</span>
                                        <span className="font-semibold text-destructive">{student.attendance_summary?.absent || 0}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/10 pt-4 border-t">
                                <Button asChild variant="outline" className="w-full text-xs h-8 gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    <Link href={`/dashboard/guru-wali/students/${student.id}`}>
                                        <ExternalLink className="w-3.5 h-3.5" /> Lihat Detail & Catatan
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
