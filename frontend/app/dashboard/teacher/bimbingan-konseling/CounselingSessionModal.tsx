import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { InputSearch } from "@/components/ui/input-search"

interface Student {
    id: number;
    public_id: string;
    name: string;
    nisn: string;
}

interface CounselingFormData {
    student_id: string;
    counseling_date: string;
    topic: string;
    notes: string;
    status: string;
}

export default function CounselingSessionModal({ isOpen, onClose, prefilledStudent }: { isOpen: boolean, onClose: () => void, prefilledStudent?: Student }) {
    const queryClient = useQueryClient()

    const [formData, setFormData] = useState<CounselingFormData>({
        student_id: prefilledStudent ? String(prefilledStudent.public_id || prefilledStudent.id) : "",
        counseling_date: new Date().toISOString().split('T')[0],
        topic: "Disiplin",
        notes: "",
        status: "open"
    })
    const [selectedStudentName, setSelectedStudentName] = useState(prefilledStudent?.name || "")

    const { data: students, isLoading: studentsLoading } = useQuery({
        queryKey: ["all-students-counseling"],
        queryFn: async () => (await api.get(`/students`)).data?.data || [],
        enabled: isOpen && !prefilledStudent
    })

    const mutation = useMutation({
        mutationFn: async (data: CounselingFormData) => {
            return await api.post("/bk/counseling-sessions", data)
        },
        onSuccess: () => {
            toast.success("Catatan sesi konseling berhasil disimpan.")
            queryClient.invalidateQueries({ queryKey: ["bk-recent-sessions"] })
            queryClient.invalidateQueries({ queryKey: ["bk-dashboard-stats"] })
            onClose()
        },
        onError: (error: unknown) => {
            toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Gagal menyimpan sesi konseling.")
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.student_id) {
            toast.error("Silakan pilih siswa terlebih dahulu.")
            return
        }
        mutation.mutate(formData)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Catat Sesi Konseling Baru</DialogTitle>
                    <DialogDescription>
                        Simpan riwayat intervensi atau konseling dengan siswa.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Siswa</Label>
                        {prefilledStudent ? (
                            <div className="p-2 bg-slate-100 rounded text-sm font-medium border text-slate-800">
                                {selectedStudentName}
                            </div>
                        ) : (
                            <div className="border rounded-md">
                                <InputSearch
                                    placeholder={studentsLoading ? "Memuat..." : "Cari nama/NISN siswa..."}
                                    data={students || []}
                                    isLoading={studentsLoading}
                                    onSearch={(t) => {
                                        if (!students) return [];
                                        const lt = t.toLowerCase();
                                        return students.filter((s: Student) => s.name.toLowerCase().includes(lt) || s.nisn?.toLowerCase().includes(lt))
                                    }}
                                    keyExtractor={(s: Student) => String(s.public_id || s.id)}
                                    renderItem={(s: Student) => <span className="text-sm px-2 py-1 block">{s.name} <span className="text-muted-foreground text-xs ml-2">({s.nisn})</span></span>}
                                    onSelect={(s: Student) => {
                                        setFormData(prev => ({ ...prev, student_id: String(s.public_id || s.id) }))
                                        setSelectedStudentName(s.name)
                                    }}
                                />
                                {selectedStudentName && !prefilledStudent && (
                                    <div className="p-2 bg-slate-50 text-xs font-medium border-t flex justify-between items-center">
                                        <span>Terpilih: {selectedStudentName}</span>
                                        <button type="button" onClick={() => {
                                            setFormData(p => ({ ...p, student_id: "" }))
                                            setSelectedStudentName("")
                                        }} className="text-red-500 hover:text-red-700">Batal</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tanggal</Label>
                            <Input
                                type="date"
                                value={formData.counseling_date}
                                onChange={(e) => setFormData(prev => ({ ...prev, counseling_date: e.target.value }))}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Kategori Topik</Label>
                            <Select
                                value={formData.topic}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, topic: val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih topik" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Akademik">Akademik</SelectItem>
                                    <SelectItem value="Disiplin">Disiplin / Perilaku</SelectItem>
                                    <SelectItem value="Pribadi">Masalah Pribadi</SelectItem>
                                    <SelectItem value="Karir">Karir / Lanjutan Studi</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Catatan Konseling</Label>
                        <Textarea
                            placeholder="Tuliskan ringkasan masalah, saran, atau hasil pertemuan..."
                            className="resize-none h-24"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Status / Tindak Lanjut</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="open">Open (Kasus Baru)</SelectItem>
                                <SelectItem value="follow_up_needed">Perlu Tindak Lanjut</SelectItem>
                                <SelectItem value="resolved">Resolved (Selesai)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={mutation.isPending || !formData.student_id}>
                            {mutation.isPending ? "Menyimpan..." : "Simpan Sesi"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
