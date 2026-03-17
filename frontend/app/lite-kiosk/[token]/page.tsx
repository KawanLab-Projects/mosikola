"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ScanLine, XCircle, CheckCircle2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import QrScanner from "@/app/components/QrScanner";

interface Student {
    id: number;
    public_id: string;
    name: string;
    nisn: string;
    nfc_uid: string | null;
}

interface OutboxRecord {
    student_id: number;
    student_name: string;
    type: 'check_in' | 'check_out';
    method: 'nfc' | 'barcode' | 'offline';
    timestamp: string;
}

export default function LiteKioskTokenPage() {
    const params = useParams();
    const kioskToken = params?.token as string;

    const [qrToken, setQrToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);
    const [nfcInput, setNfcInput] = useState("");
    const [isScanningBarcode, setIsScanningBarcode] = useState(false);

    // Offline-first states
    const [students, setStudents] = useState<Student[]>([]);
    const [outbox, setOutbox] = useState<OutboxRecord[]>([]);
    const lastActivityTime = useRef<number>(Date.now());
    const isSyncing = useRef(false);

    const clickCountRef = useRef({ count: 0, lastClick: 0 });
    const spaceCountRef = useRef({ count: 0, lastClick: 0 });

    // Notification state
    const [notification, setNotification] = useState<{
        show: boolean;
        type: "success" | "error" | "warning";
        message: string;
        student?: string;
    }>({ show: false, type: "success", message: "" });

    const notificationTimeout = useRef<NodeJS.Timeout | null>(null);

    const showNotification = useCallback((type: "success" | "error" | "warning", message: string, student?: string) => {
        setNotification({ show: true, type, message, student });

        if (notificationTimeout.current) {
            clearTimeout(notificationTimeout.current);
        }

        notificationTimeout.current = setTimeout(() => {
            setNotification((prev) => ({ ...prev, show: false }));
        }, 5000);
    }, []);

    const fetchStudents = useCallback(async (token: string) => {
        try {
            const response = await api.get("kiosk/students", {
                headers: { "x-kiosk-token": token }
            });
            const data = response.data.data;
            setStudents(data);
            localStorage.setItem("mosikola_kiosk_students", JSON.stringify(data));
        } catch (error) {
            console.error("Failed to fetch students", error);
            const cached = localStorage.getItem("mosikola_kiosk_students");
            if (cached) setStudents(JSON.parse(cached));
        }
    }, []);

    const syncOutbox = useCallback(async (token: string, records: OutboxRecord[]) => {
        if (records.length === 0 || isSyncing.current) return;

        try {
            isSyncing.current = true;
            await api.post("kiosk/attendance/batch", { records }, {
                headers: { "x-kiosk-token": token }
            });
            setOutbox([]);
            localStorage.setItem("mosikola_kiosk_outbox", "[]");
            showNotification("success", "Sinkronisasi data berhasil");
        } catch (error) {
            console.error("Sync failed", error);
        } finally {
            isSyncing.current = false;
        }
    }, [showNotification]);

    const recordOfflineAttendance = useCallback((student: Student, method: 'nfc' | 'barcode' | 'offline') => {
        lastActivityTime.current = Date.now();

        const today = new Date().toISOString().split('T')[0];
        const alreadyScanned = outbox.find(r => r.student_id === student.id && r.timestamp.startsWith(today));
        const type = alreadyScanned ? 'check_out' : 'check_in';

        const newRecord: OutboxRecord = {
            student_id: student.id,
            student_name: student.name,
            type,
            method,
            timestamp: new Date().toISOString()
        };

        const updatedOutbox = [...outbox, newRecord];
        setOutbox(updatedOutbox);
        localStorage.setItem("mosikola_kiosk_outbox", JSON.stringify(updatedOutbox));

        showNotification("success", `Berhasil Check-${type === 'check_in' ? 'In' : 'Out'} (Offline)`, student.name);
    }, [outbox, showNotification]);

    const fetchToken = useCallback(async () => {
        try {
            setLoading(true);
            if (!kioskToken) return;

            const response = await api.get("kiosk/token", {
                headers: { "x-kiosk-token": kioskToken }
            });

            setQrToken(response.data.token);
            const expiresAt = response.data.expires_at;
            const clientTime = Date.now();
            const expiresDate = new Date(expiresAt);
            const difMs = expiresDate.getTime() - clientTime;
            const timeDiff = Math.max(0, Math.round(difMs / 1000));

            setTimeLeft(timeDiff);
        } catch (error) {
            console.error("Failed to fetch token", error);
            showNotification("error", "Gagal memuat token Kiosk. Periksa koneksi.");
        } finally {
            setLoading(false);
        }
    }, [kioskToken, showNotification]);

    const processNfcScan = useCallback(async (uid: string) => {
        if (!kioskToken) return;

        // Offline-first lookup
        const student = students.find(s => s.nfc_uid === uid);
        if (student) {
            recordOfflineAttendance(student, 'nfc');
            return;
        }

        showNotification("error", "Kartu tidak dikenali (NFC UID: " + uid + ")");
    }, [kioskToken, students, recordOfflineAttendance, showNotification]);

    const processBarcodeScan = useCallback(async (nisn: string) => {
        if (!kioskToken || isScanningBarcode) return;

        setIsScanningBarcode(true);
        setTimeout(() => setIsScanningBarcode(false), 3000);

        // Offline-first lookup
        const student = students.find(s => s.nisn === nisn);
        if (student) {
            recordOfflineAttendance(student, 'barcode');
            return;
        }

        showNotification("error", "NISN tidak dikenali: " + nisn);
    }, [kioskToken, isScanningBarcode, students, recordOfflineAttendance, showNotification]);

    const triggerReset = useCallback(() => {
        localStorage.removeItem("mosikola_kiosk_token");
        showNotification("success", "Kiosk berhasil di-reset. Silahkan kembali ke halaman utama.");
        // We don't have isSetupMode here, but clearing the token is the core action.
        // Optionally redirect: window.location.href = '/lite-kiosk';
    }, [showNotification]);

    const handleLogoClick = () => {
        const now = Date.now();
        const { count, lastClick } = clickCountRef.current;

        if (now - lastClick > 1000) {
            clickCountRef.current = { count: 1, lastClick: now };
            return;
        }

        const newCount = count + 1;
        clickCountRef.current = { count: newCount, lastClick: now };

        if (newCount >= 5) {
            triggerReset();
        }
    };

    useEffect(() => {
        const storedStudents = localStorage.getItem("mosikola_kiosk_students");
        const storedOutbox = localStorage.getItem("mosikola_kiosk_outbox");

        if (storedStudents) setStudents(JSON.parse(storedStudents));
        if (storedOutbox) setOutbox(JSON.parse(storedOutbox));

        if (kioskToken) {
            fetchToken();
            fetchStudents(kioskToken);
        }
    }, [kioskToken, fetchToken, fetchStudents]);

    // Idle-based batch sync (every 1 minute check)
    useEffect(() => {
        if (!kioskToken) return;

        const syncInterval = setInterval(() => {
            const idleTime = Date.now() - lastActivityTime.current;
            const twentyMinutes = 20 * 60 * 1000;

            if (idleTime >= twentyMinutes && outbox.length > 0) {
                syncOutbox(kioskToken, outbox);
            }
        }, 60000);

        return () => clearInterval(syncInterval);
    }, [kioskToken, outbox, syncOutbox]);


    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (e.key === "Enter") {
                if (nfcInput.length > 0) {
                    processNfcScan(nfcInput);
                    setNfcInput("");
                }
            } else if (e.key === " ") {
                const now = Date.now();
                const { count, lastClick } = spaceCountRef.current;

                if (now - lastClick > 1000) {
                    spaceCountRef.current = { count: 1, lastClick: now };
                } else {
                    const newCount = count + 1;
                    spaceCountRef.current = { count: newCount, lastClick: now };
                    if (newCount >= 3) {
                        triggerReset();
                    }
                }
            } else if (e.key.length === 1) {
                setNfcInput(prev => prev + e.key);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [nfcInput, processNfcScan, triggerReset]);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Simple static notification - No Framer Motion */}
            {notification.show && (
                <div className={`absolute inset-0 z-100 flex flex-col items-center justify-center p-8 text-center bg-slate-950/95`}>
                    <div className={`p-8 rounded-2xl border-2 ${notification.type === 'success' ? 'bg-green-900/20 border-green-500' :
                        notification.type === 'warning' ? 'bg-yellow-900/20 border-yellow-500' :
                            'bg-red-900/20 border-red-500'
                        }`}>
                        {notification.type === 'success' || notification.type === 'warning' ? (
                            <CheckCircle2 className={`w-32 h-32 mx-auto mb-6 ${notification.type === 'success' ? 'text-green-500' : 'text-yellow-500'}`} />
                        ) : (
                            <XCircle className="w-32 h-32 mx-auto mb-6 text-red-500" />
                        )}
                        <h3 className="text-4xl font-bold text-white mb-2">{notification.message}</h3>
                        {notification.student && <p className="text-2xl text-white/90 font-medium">{notification.student}</p>}
                    </div>
                </div>
            )}

            <div className="z-10 w-full max-w-6xl flex flex-col gap-12 items-center justify-center">
                <div className="text-center">
                    <h1
                        className="text-5xl font-bold text-white tracking-tight cursor-pointer select-none"
                        onClick={handleLogoClick}
                    >
                        <span className="text-blue-500">Anjungan</span> Mosikola
                    </h1>
                    <p className="text-2xl text-slate-400 mt-4">Scan kartu atau tempel reader NFC.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl">
                    {/* QR Code */}
                    <Card className="border-slate-800 bg-slate-900 shadow-xl overflow-hidden rounded-3xl">
                        <CardHeader className="bg-slate-800/80 p-6">
                            <CardTitle className="text-white flex justify-between items-center text-xl">
                                <span>Login QR</span>
                                <span className="bg-slate-950 px-4 py-1 rounded-full text-base font-mono">{timeLeft}s</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center p-12">
                            <div className="bg-white p-6 rounded-2xl">
                                {loading && !qrToken ? (
                                    <div className="w-[220px] h-[220px] flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-slate-400" /></div>
                                ) : qrToken ? (
                                    <QRCodeSVG value={qrToken} size={220} />
                                ) : (
                                    <div className="w-[220px] h-[220px] flex flex-col items-center justify-center text-slate-400">
                                        <XCircle className="w-10 h-10 text-red-500 mb-4" />
                                        <span>Koneksi Gagal</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Scanner */}
                    <Card className="border-slate-800 bg-slate-900 shadow-xl overflow-hidden rounded-3xl">
                        <CardHeader className="bg-slate-800/80 p-6">
                            <CardTitle className="text-white text-xl">Scanner Kamera</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center p-12">
                            <div className="w-64 h-64 rounded-3xl overflow-hidden bg-black border-4 border-slate-700 shadow-inner">
                                <QrScanner id="lite-kiosk-token-scanner" onScan={processBarcodeScan} facingMode="environment" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex gap-8 text-sm text-slate-400 font-medium">
                    <div className="flex items-center gap-2"><ScanLine className="w-5 h-5 text-blue-500" /> NFC Ready</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> Low Memory Mode Active</div>
                </div>
            </div>
        </div>
    );
}
