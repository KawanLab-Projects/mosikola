"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Search, RefreshCcw } from "lucide-react";

interface Classroom {
    id: number;
    public_id: string;
    name: string;
}

interface AttendanceData {
    id: number;
    public_id: string;
    attended_at: string;
    type: string;
    status: string;
    method: string;
    student: {
        name: string;
        nisn: string;
        classroom: {
            name: string;
        };
    };
}

export default function AbsenUmumPage() {
    const [attendances, setAttendances] = useState<AttendanceData[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(false);

    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
    const [selectedClassroom, setSelectedClassroom] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchClassrooms = async () => {
        try {
            const response = await api.get("/classrooms");
            setClassrooms(response.data.data);
        } catch (error) {
            console.error("Failed to fetch classrooms", error);
        }
    };

    const fetchAttendances = useCallback(async () => {
        setLoading(true);
        try {
            let url = `/absensi?date=${selectedDate}`;
            if (selectedClassroom !== "all") {
                url += `&classroom_id=${selectedClassroom}`;
            }
            const response = await api.get(url);
            setAttendances(response.data.data);
        } catch (error) {
            console.error("Failed to fetch attendances", error);
        } finally {
            setLoading(false);
        }
    }, [selectedDate, selectedClassroom]);

    useEffect(() => {
        fetchClassrooms();
    }, []);

    useEffect(() => {
        fetchAttendances();
    }, [fetchAttendances]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'hadir':
                return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Hadir</Badge>;
            case 'terlambat':
                return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Terlambat</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const filteredAttendances = attendances.filter(record =>
        record.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.student.nisn.includes(searchQuery)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Rekap Absensi Umum</h1>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        onClick={fetchAttendances}
                        disabled={loading}
                    >
                        <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="p-4 sm:p-6 pb-0">
                    <CardTitle className="text-lg">Filter Data</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tanggal</label>
                            <div className="flex items-center relative">
                                <Calendar className="absolute left-3 w-4 h-4 text-slate-400" />
                                <Input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Kelas</label>
                            <Select
                                value={selectedClassroom}
                                onValueChange={setSelectedClassroom}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Kelas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kelas</SelectItem>
                                    {classrooms.map(c => (
                                        <SelectItem key={c.public_id} value={c.public_id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cari Siswa</label>
                            <div className="flex items-center relative">
                                <Search className="absolute left-3 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Nama atau NISN..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Waktu</TableHead>
                                <TableHead>Siswa</TableHead>
                                <TableHead>Kelas</TableHead>
                                <TableHead>Tipe</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Metode</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-32">
                                        <div className="flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredAttendances.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-slate-500 h-32">
                                        Tidak ada data absensi ditemukan
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAttendances.map(record => (
                                    <TableRow key={record.public_id || record.id}>
                                        <TableCell>
                                            <span className="font-medium">
                                                {format(new Date(record.attended_at), 'HH:mm', { locale: id })}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{record.student.name}</p>
                                                <p className="text-xs text-slate-500">{record.student.nisn}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>{record.student.classroom?.name || '-'}</TableCell>
                                        <TableCell>
                                            {record.type === 'check_in' ? 'Check In' : 'Check Out'}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(record.status)}
                                        </TableCell>
                                        <TableCell>
                                            <span className="uppercase text-xs font-semibold px-2 py-1 bg-slate-100 rounded-md">
                                                {record.method}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}
