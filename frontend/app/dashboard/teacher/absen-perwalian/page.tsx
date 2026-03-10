"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import GeneralAttendanceTab from "./GeneralAttendanceTab"
import JournalAttendanceTab from "./JournalAttendanceTab"
import { AlertCircle } from "lucide-react"
import { api } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"

interface Classroom {
    id: string;
    name: string;
}

interface TeacherAssignment {
    id: string;
    assignment_type: string;
    classroom?: Classroom;
}

interface User {
    id: string;
    name: string;
    teacher?: {
        id: string;
        assignments?: TeacherAssignment[];
    };
}

export default function AbsenPerwalianPage() {
    const [activeTab, setActiveTab] = useState("general")

    const { data: user, isLoading } = useQuery<User>({
        queryKey: ["auth-me-teacher-check"],
        queryFn: async () => {
            const res = await api.get("/auth/me")
            return res.data.user
        },
    })

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
        )
    }

    // Check if user has wali_kelas assignment
    const isWaliKelas = user?.teacher?.assignments?.some(
        (assignment: TeacherAssignment) => assignment.assignment_type === "wali_kelas"
    )

    if (!isWaliKelas) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6 space-y-4">
                <div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                    <AlertCircle className="h-10 w-10" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">Akses Ditolak</h1>
                <p className="text-muted-foreground text-base max-w-sm">Halaman ini khusus untuk guru yang ditugaskan sebagai Wali Kelas. Anda tidak memiliki akses ke halaman ini.</p>
            </div>
        )
    }

    const classroomName = user?.teacher?.assignments?.find(
        (a: TeacherAssignment) => a.assignment_type === "wali_kelas"
    )?.classroom?.name || "Kelas"

    return (
        <div className="flex-1 space-y-6 p-8">
            <div className="flex flex-col space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Absen Perwalian</h2>
                <p className="text-muted-foreground">
                    Pantau data kehadiran Umum dan Jurnal Mapel untuk kelas perwalian {classroomName}.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                    <TabsTrigger value="general">Absen Umum</TabsTrigger>
                    <TabsTrigger value="journal">Absen Mapel</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Kehadiran Umum (Harian)</CardTitle>
                            <CardDescription>
                                Ringkasan data kehadiran harian siswa di kelas {classroomName}.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <GeneralAttendanceTab />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="journal" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Kehadiran Mapel (Jurnal)</CardTitle>
                            <CardDescription>
                                Ringkasan data kehadiran siswa berdasarkan jurnal mata pelajaran untuk kelas {classroomName}.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <JournalAttendanceTab />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
