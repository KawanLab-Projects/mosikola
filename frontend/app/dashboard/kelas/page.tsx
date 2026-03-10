"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Pencil, Trash2, Search, Upload, Download, Users } from "lucide-react"
import { api } from "@/lib/api"
import * as XLSX from "xlsx"
import { Classroom, StudyProgram, Student, StudentInput } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

// Grade levels per school type
const GRADE_OPTIONS: Record<string, number[]> = {
    SD: [1, 2, 3, 4, 5, 6],
    MI: [1, 2, 3, 4, 5, 6],
    SMP: [7, 8, 9],
    MTS: [7, 8, 9],
    SMA: [10, 11, 12],
    SMK: [10, 11, 12],
    MA: [10, 11, 12],
    MAK: [10, 11, 12],
}

const HAS_JURUSAN = ["SMK", "SMA", "MA", "MAK"]

export default function KelasPage() {
    const [classrooms, setClassrooms] = useState<Classroom[]>([])
    const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Detect school type once
    const [schoolType, setSchoolType] = useState("")
    const hasJurusan = HAS_JURUSAN.includes(schoolType)
    const gradeOptions = GRADE_OPTIONS[schoolType] ?? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

    useEffect(() => {
        // Default to "OTHER" so schoolType is never empty — ensures the guard below
        // always lets through and fetchClassrooms() is only called once.
        const st = (localStorage.getItem("school_type") || "OTHER").toUpperCase()
        setSchoolType(st)
    }, [])

    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
    const [isStudentsDialogOpen, setIsStudentsDialogOpen] = useState(false)
    const [isStudentFormDialogOpen, setIsStudentFormDialogOpen] = useState(false)
    const [isDeleteStudentDialogOpen, setIsDeleteStudentDialogOpen] = useState(false)
    const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null)
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        short: "",
        grade_level: "",
        study_program_public_id: "",
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Student management
    const [students, setStudents] = useState<Student[]>([])
    const [isLoadingStudents, setIsLoadingStudents] = useState(false)
    const [studentSearchQuery, setStudentSearchQuery] = useState("")
    const [studentFormData, setStudentFormData] = useState<StudentInput>({
        name: "", nisn: "", email: "", birth_place: "", birth_date: "", address: "",
        parent_name: "", parent_phone: "",
    })
    const [isSubmittingStudent, setIsSubmittingStudent] = useState(false)

    // --- Data fetching ---


    const fetchStudyPrograms = async () => {
        try {
            const response = await api.get('/study-programs')
            const data = response.data.data || response.data
            setStudyPrograms(Array.isArray(data) ? data : [])
        } catch {
            toast.error("Gagal memuat data jurusan")
        }
    }

    const fetchClassrooms = async () => {
        setIsLoading(true)
        try {
            // Always fetch all tenant classrooms via the tenant-scoped endpoint.
            // This covers both study-program classrooms and XML-imported ones (no study_program).
            const res = await api.get('/classrooms')
            const data = res.data.data || res.data
            setClassrooms(Array.isArray(data) ? data : [])
        } catch {
            toast.error("Gagal memuat data kelas")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (!schoolType) return
        fetchClassrooms()
        // Also fetch study programs for the create form dropdown (SMK/SMA need them)
        if (hasJurusan) fetchStudyPrograms()
    }, [schoolType, hasJurusan])

    // --- Classroom CRUD ---

    const handleOpenDialog = (classroom?: Classroom) => {
        if (classroom) {
            setSelectedClassroom(classroom)
            setFormData({
                name: classroom.name,
                short: classroom.short,
                grade_level: String(classroom.grade_level ?? ""),
                study_program_public_id: classroom.study_program?.public_id || "",
            })
        } else {
            setSelectedClassroom(null)
            setFormData({ name: "", short: "", grade_level: "", study_program_public_id: "" })
        }
        setIsDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const payload = {
                name: formData.name,
                short: formData.short,
                grade_level: Number(formData.grade_level),
                ...(hasJurusan && { study_program_public_id: formData.study_program_public_id })
            }

            if (selectedClassroom) {
                await api.put(`/classrooms/${selectedClassroom.public_id}`, payload)
                toast.success("Kelas berhasil diperbarui")
            } else if (hasJurusan) {
                // SMK/SMA: POST under study-program
                await api.post(`/study-programs/${formData.study_program_public_id}/classrooms`, payload)
                toast.success("Kelas berhasil ditambahkan")
            } else {
                // SD/SMP: POST directly
                await api.post('/classrooms', payload)
                toast.success("Kelas berhasil ditambahkan")
            }
            setIsDialogOpen(false)
            fetchClassrooms()
        } catch (err: unknown) {
            const errorMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Gagal menyimpan kelas"
            toast.error(errorMsg)
        } finally {
            setIsSubmitting(false)
        }
    }

    const confirmDelete = (classroom: Classroom) => {
        setSelectedClassroom(classroom)
        setIsDeleteDialogOpen(true)
    }

    const handleDelete = async () => {
        if (!selectedClassroom) return
        try {
            await api.delete(`/classrooms/${selectedClassroom.public_id}`)
            toast.success("Kelas berhasil dihapus")
            setIsDeleteDialogOpen(false)
            fetchClassrooms()
        } catch {
            toast.error("Gagal menghapus kelas")
        }
    }

    // --- Import ---

    const handleOpenImportDialog = (classroom: Classroom) => {
        setSelectedClassroom(classroom)
        setIsImportDialogOpen(true)
    }

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedClassroom || !fileInputRef.current?.files?.[0]) {
            toast.error("Silakan pilih file terlebih dahulu")
            return
        }
        setIsImporting(true)

        try {
            const file = fileInputRef.current.files[0]
            const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')

            let uploadFile = file;

            if (isExcel) {
                // Read and convert to CSV
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data);
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to CSV string. raw: true ensures numbers/dates aren't formatted weirdly.
                const csvString = XLSX.utils.sheet_to_csv(worksheet, { forceQuotes: true });

                // Create a new CSV Blob
                const csvBlob = new Blob([csvString], { type: 'text/csv' });
                uploadFile = new File([csvBlob], file.name.replace(/\.xlsx?$/, '.csv'), { type: 'text/csv' });
            }

            const fd = new FormData()
            fd.append("file", uploadFile)

            await api.post(`/classrooms/${selectedClassroom.public_id}/import-students`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            })

            toast.success("Data siswa berhasil diimport")
            setIsImportDialogOpen(false)
            if (isStudentsDialogOpen) {
                fetchStudents(selectedClassroom.public_id);
            }
        } catch (error: unknown) {
            console.error("Import error:", error);
            const err = error as { response?: { data?: { message?: string }; status?: number } };
            if (err.response?.status === 422) {
                toast.warning(err.response.data?.message || "Gagal mengimport data siswa")
                if (isStudentsDialogOpen) {
                    fetchStudents(selectedClassroom.public_id);
                }
                setIsImportDialogOpen(false)
            } else {
                toast.error(err.response?.data?.message || "Gagal mengimport data siswa")
            }
        } finally {
            setIsImporting(false)
        }
    }

    const handleDownloadTemplate = async () => {
        try {
            const response = await api.get('/download-template', { responseType: 'blob' })
            const blob = new Blob([response.data])
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', 'template_siswa.xlsx')
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch {
            toast.error('Gagal mengunduh template')
        }
    }

    // --- Student CRUD ---

    const handleOpenStudentsDialog = async (classroom: Classroom) => {
        setSelectedClassroom(classroom)
        setIsStudentsDialogOpen(true)
        await fetchStudents(classroom.public_id)
    }

    const fetchStudents = async (classroomPublicId: string) => {
        setIsLoadingStudents(true)
        try {
            const response = await api.get(`/classrooms/${classroomPublicId}/students`)
            const data = response.data.students || response.data.data || response.data
            setStudents(Array.isArray(data) ? data : [])
        } catch {
            toast.error("Gagal memuat data siswa")
        } finally {
            setIsLoadingStudents(false)
        }
    }

    const handleOpenStudentFormDialog = (student?: Student) => {
        if (student) {
            setSelectedStudent(student)
            setStudentFormData({
                name: student.name, nisn: student.nisn, email: student.email || "",
                birth_place: student.birth_place || "", birth_date: student.birth_date, address: student.address,
                parent_name: student.parent_name, parent_phone: student.parent_phone,
            })
        } else {
            setSelectedStudent(null)
            setStudentFormData({ name: "", nisn: "", email: "", birth_place: "", birth_date: "", address: "", parent_name: "", parent_phone: "" })
        }
        setIsStudentFormDialogOpen(true)
    }

    const handleSubmitStudent = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedClassroom) return
        setIsSubmittingStudent(true)
        try {
            if (selectedStudent) {
                await api.put(`/students/${selectedStudent.public_id}`, studentFormData)
                toast.success("Data siswa berhasil diperbarui")
            } else {
                await api.post(`/classrooms/${selectedClassroom.public_id}/students`, studentFormData)
                toast.success("Siswa berhasil ditambahkan")
            }
            setIsStudentFormDialogOpen(false)
            await fetchStudents(selectedClassroom.public_id)
        } catch (error: unknown) {
            console.error("Submit student error:", error);
            const err = error as { response?: { data?: { message?: string }; status?: number } };
            if (err.response?.status === 422) {
                toast.warning(err.response.data?.message || "Gagal menyimpan data siswa")
            } else {
                toast.error(err.response?.data?.message || "Gagal menyimpan data siswa")
            }
        } finally {
            setIsSubmittingStudent(false)
        }
    }

    const confirmDeleteStudent = (student: Student) => {
        setSelectedStudent(student)
        setIsDeleteStudentDialogOpen(true)
    }

    const handleDeleteStudent = async () => {
        if (!selectedStudent || !selectedClassroom) return
        try {
            await api.delete(`/students/${selectedStudent.public_id}`)
            toast.success("Siswa berhasil dihapus")
            setIsDeleteStudentDialogOpen(false)
            await fetchStudents(selectedClassroom.public_id)
        } catch {
            toast.error("Gagal menghapus siswa")
        }
    }

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
        s.nisn.toLowerCase().includes(studentSearchQuery.toLowerCase())
    )

    const filteredClassrooms = classrooms.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.short.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.study_program?.name ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    )


    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Manajemen Kelas</h1>
                    <p className="text-muted-foreground">Kelola daftar kelas dan data siswa.</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Kelas
                </Button>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Cari kelas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9"
                />
            </div>

            <div className="border rounded-md bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Kelas</TableHead>
                            <TableHead>Kode</TableHead>
                            <TableHead>Tingkat</TableHead>
                            {hasJurusan && <TableHead>Jurusan</TableHead>}
                            <TableHead>Wali Kelas</TableHead>
                            <TableHead className="w-[150px] text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={hasJurusan ? 6 : 5} className="h-24 text-center">Memuat data...</TableCell>
                            </TableRow>
                        ) : filteredClassrooms.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={hasJurusan ? 6 : 5} className="h-24 text-center text-muted-foreground">
                                    Tidak ada data kelas.
                                </TableCell>
                            </TableRow>
                        ) : filteredClassrooms.map((classroom) => (
                            <TableRow key={classroom.public_id}>
                                <TableCell className="font-medium">{classroom.name}</TableCell>
                                <TableCell>{classroom.short}</TableCell>
                                <TableCell>
                                    {classroom.grade_level
                                        ? <Badge variant="outline">Kelas {classroom.grade_level}</Badge>
                                        : <span className="text-muted-foreground">-</span>
                                    }
                                </TableCell>
                                {hasJurusan && <TableCell>{classroom.study_program?.name || "-"}</TableCell>}
                                <TableCell>
                                    {classroom.homeroom_assignment?.teacher ? (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            {classroom.homeroom_assignment.teacher.name}
                                        </Badge>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">
                                            Belum ditentukan
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="icon" title="Lihat Siswa"
                                            onClick={() => handleOpenStudentsDialog(classroom)}>
                                            <Users className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" title="Import Siswa"
                                            onClick={() => handleOpenImportDialog(classroom)}>
                                            <Upload className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon"
                                            onClick={() => handleOpenDialog(classroom)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => confirmDelete(classroom)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Create/Edit Classroom Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedClassroom ? "Edit Kelas" : "Tambah Kelas Baru"}</DialogTitle>
                        <DialogDescription>
                            Isi informasi kelas di bawah ini.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Jurusan selector — only for SMK/SMA */}
                        {hasJurusan && (
                            <div className="grid gap-2">
                                <Label htmlFor="study_program">Jurusan</Label>
                                <Select
                                    value={formData.study_program_public_id}
                                    onValueChange={(v) => setFormData({ ...formData, study_program_public_id: v })}
                                    required
                                >
                                    <SelectTrigger id="study_program">
                                        <SelectValue placeholder="Pilih jurusan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {studyPrograms.map((sp) => (
                                            <SelectItem key={sp.public_id} value={sp.public_id}>
                                                {sp.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Grade level — always shown */}
                        <div className="grid gap-2">
                            <Label htmlFor="grade_level">Tingkat Kelas</Label>
                            <Select
                                value={formData.grade_level}
                                onValueChange={(v) => setFormData({ ...formData, grade_level: v })}
                                required
                            >
                                <SelectTrigger id="grade_level">
                                    <SelectValue placeholder="Pilih tingkat kelas" />
                                </SelectTrigger>
                                <SelectContent>
                                    {gradeOptions.map((g) => (
                                        <SelectItem key={g} value={String(g)}>
                                            Kelas {g}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="nama_kelas">Nama Kelas</Label>
                            <Input
                                id="nama_kelas"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder={hasJurusan ? "Contoh: XII RPL 1" : "Contoh: 7A"}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="kode_kelas">Kode Kelas</Label>
                            <Input
                                id="kode_kelas"
                                value={formData.short}
                                onChange={(e) => setFormData({ ...formData, short: e.target.value })}
                                placeholder={hasJurusan ? "Contoh: 12RPL1" : "Contoh: 7A"}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Menyimpan..." : "Simpan"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Import Dialog */}
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Import Data Siswa</DialogTitle>
                        <DialogDescription>
                            Upload file Excel (.xlsx) berisi data siswa untuk kelas <strong>{selectedClassroom?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleImport} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="file">File Excel / CSV</Label>
                            <Input id="file" type="file" accept=".xlsx, .xls, .csv" ref={fileInputRef} required />
                        </div>
                        <Button type="button" variant="outline" size="sm"
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white hover:text-white"
                            onClick={handleDownloadTemplate}>
                            <Download className="mr-2 h-4 w-4" />
                            Download Template Excel
                        </Button>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsImportDialogOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={isImporting}>
                                {isImporting ? "Mengupload..." : "Upload"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Classroom Alert */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Apakah anda yakin?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus kelas
                            <span className="font-semibold"> {selectedClassroom?.name} </span>
                            beserta seluruh data siswa di dalamnya.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Students Dialog */}
            <Dialog open={isStudentsDialogOpen} onOpenChange={setIsStudentsDialogOpen}>
                <DialogContent className="max-w-6xl lg:max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Daftar Siswa — {selectedClassroom?.name}</DialogTitle>
                        <DialogDescription>Kelola siswa di kelas ini.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 flex-1">
                                <Search className="h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari siswa..."
                                    value={studentSearchQuery}
                                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <Button onClick={() => handleOpenStudentFormDialog()} size="sm">
                                <Plus className="mr-2 h-4 w-4" />Tambah Siswa
                            </Button>
                        </div>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>NISN</TableHead>
                                        <TableHead>Nama Orang Tua</TableHead>
                                        <TableHead className="w-[100px] text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingStudents ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">Memuat data siswa...</TableCell>
                                        </TableRow>
                                    ) : filteredStudents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Tidak ada data siswa.</TableCell>
                                        </TableRow>
                                    ) : filteredStudents.map((student) => (
                                        <TableRow key={student.public_id}>
                                            <TableCell className="font-medium">{student.name}</TableCell>
                                            <TableCell>{student.nisn}</TableCell>
                                            <TableCell>{student.parent_name}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon"
                                                        onClick={() => handleOpenStudentFormDialog(student)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon"
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => confirmDeleteStudent(student)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add/Edit Student Dialog */}
            <Dialog open={isStudentFormDialogOpen} onOpenChange={setIsStudentFormDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedStudent ? "Edit Siswa" : "Tambah Siswa Baru"}</DialogTitle>
                        <DialogDescription>
                            Isi informasi siswa di bawah ini.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitStudent} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="student_name">Nama Lengkap</Label>
                            <Input id="student_name" value={studentFormData.name}
                                onChange={(e) => setStudentFormData({ ...studentFormData, name: e.target.value })}
                                placeholder="Contoh: Ahmad Fauzi" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="nisn">NISN</Label>
                            <Input id="nisn" value={studentFormData.nisn}
                                onChange={(e) => setStudentFormData({ ...studentFormData, nisn: e.target.value })}
                                placeholder="Contoh: 0012345678" required disabled={!!selectedStudent} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="birth_place">Tempat Lahir</Label>
                            <Input id="birth_place" value={studentFormData.birth_place}
                                onChange={(e) => setStudentFormData({ ...studentFormData, birth_place: e.target.value })}
                                placeholder="Contoh: Jakarta" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="birth_date">Tanggal Lahir</Label>
                            <Input id="birth_date" type="date" value={studentFormData.birth_date}
                                onChange={(e) => setStudentFormData({ ...studentFormData, birth_date: e.target.value })}
                                required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="address">Alamat</Label>
                            <Input id="address" value={studentFormData.address}
                                onChange={(e) => setStudentFormData({ ...studentFormData, address: e.target.value })}
                                placeholder="Contoh: Jl. Merdeka No. 123" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="parent_name">Nama Orang Tua</Label>
                            <Input id="parent_name" value={studentFormData.parent_name}
                                onChange={(e) => setStudentFormData({ ...studentFormData, parent_name: e.target.value })}
                                placeholder="Contoh: Budi Santoso" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="parent_phone">No. Telepon Orang Tua</Label>
                            <Input id="parent_phone" type="tel" value={studentFormData.parent_phone}
                                onChange={(e) => setStudentFormData({ ...studentFormData, parent_phone: e.target.value })}
                                placeholder="Contoh: 081234567890" required />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsStudentFormDialogOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={isSubmittingStudent}>
                                {isSubmittingStudent ? "Menyimpan..." : "Simpan"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Student Alert */}
            <AlertDialog open={isDeleteStudentDialogOpen} onOpenChange={setIsDeleteStudentDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Apakah anda yakin?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ini akan menghapus data siswa
                            <span className="font-semibold"> {selectedStudent?.name} </span>
                            dari sistem.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteStudent} className="bg-red-500 hover:bg-red-600">
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}