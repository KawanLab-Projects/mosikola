"use client"

import { useEffect, useState, useCallback } from "react"
import { api } from "@/lib/api"
import { Classroom, Student, StudyProgram } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Users } from "lucide-react"

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)

    // Filter Logic
    const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([])
    const [classrooms, setClassrooms] = useState<Classroom[]>([])

    // Search State
    const [programId, setProgramId] = useState<string>("")
    const [classId, setClassId] = useState<string>("")
    const [nameQuery, setNameQuery] = useState<string>("")

    const fetchStudyPrograms = useCallback(async () => {
        try {
            const response = await api.get('/api/study-programs')
            setStudyPrograms(response.data.data)
        } catch (error) {
            console.error(error)
        }
    }, [])

    const fetchClassrooms = useCallback(async (programId: string) => {
        try {
            const response = await api.get(`/api/classrooms?study_program_id=${programId}`)
            setClassrooms(response.data.data)
        } catch (error) {
            console.error(error)
        }
    }, [])

    useEffect(() => {
        fetchStudyPrograms()
    }, [fetchStudyPrograms])

    useEffect(() => {
        if (programId) {
            fetchClassrooms(programId)
        } else {
            setClassrooms([])
        }
    }, [programId, fetchClassrooms])

    const handleSearchByClass = async () => {
        if (!classId) return

        setIsLoading(true)
        setHasSearched(true)
        try {
            const response = await api.get(`/api/students?classroom_id=${classId}`)
            setStudents(response.data.data)
        } catch (error) {
            console.error(error)
            setStudents([])
        } finally {
            setIsLoading(false)
        }
    }

    const handleSearchByName = async () => {
        if (!nameQuery.trim()) return

        setIsLoading(true)
        setHasSearched(true)
        try {
            // Asumsi API support ?search=name
            const response = await api.get(`/api/students?search=${nameQuery}`)
            setStudents(response.data.data)
        } catch (error) {
            console.error(error)
            setStudents([])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Data Siswa</h1>
                    <p className="text-muted-foreground">
                        Cari dan kelola data siswa
                    </p>
                </div>

            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pencarian Siswa</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="class" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                            <TabsTrigger value="class">Berdasarkan Kelas</TabsTrigger>
                            <TabsTrigger value="name">Cari Nama</TabsTrigger>
                        </TabsList>

                        <div className="mt-4">
                            <TabsContent value="class" className="space-y-4">
                                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                                    <div className="space-y-2 flex-1">
                                        <label className="text-sm font-medium">Jurusan</label>
                                        <Select value={programId} onValueChange={setProgramId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Jurusan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {studyPrograms.map((program) => (
                                                    <SelectItem key={program.public_id} value={program.public_id}>
                                                        {program.name} ({program.short})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2 flex-1">
                                        <label className="text-sm font-medium">Kelas</label>
                                        <Select value={classId} onValueChange={setClassId} disabled={!programId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Kelas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {classrooms.map((currClass) => (
                                                    <SelectItem key={currClass.public_id} value={currClass.public_id}>
                                                        {currClass.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button onClick={handleSearchByClass} disabled={!classId || isLoading}>
                                        <Users className="mr-2 h-4 w-4" />
                                        Tampilkan
                                    </Button>

                                </div>
                            </TabsContent>

                            <TabsContent value="name" className="space-y-4">
                                <div className="flex w-full max-w-sm items-center space-x-2">
                                    <Input
                                        placeholder="Ketik nama siswa..."
                                        value={nameQuery}
                                        onChange={(e) => setNameQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearchByName()}
                                    />
                                    <Button onClick={handleSearchByName} disabled={!nameQuery || isLoading}>
                                        <Search className="mr-2 h-4 w-4" />
                                        Cari
                                    </Button>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </CardContent>
            </Card>

            <div className="rounded-md border bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>NISN</TableHead>
                            <TableHead>Nama Lengkap</TableHead>
                            <TableHead>Kelas</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!hasSearched ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                    Silakan lakukan pencarian pada kolom diatas
                                </TableCell>
                            </TableRow>
                        ) : isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : students.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    Tidak ada data siswa ditemukan
                                </TableCell>
                            </TableRow>
                        ) : (
                            students.map((student) => (
                                <TableRow key={student.public_id}>
                                    <TableCell className="font-medium">{student.nisn}</TableCell>
                                    <TableCell>{student.name}</TableCell>
                                    <TableCell>{student.classroom?.name || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">
                                            Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
