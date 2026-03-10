"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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

export default function LiteKioskPage() {
    const [kioskToken, setKioskToken] = useState<string | null>(null);
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

    // Setup mode states
    const [isSetupMode, setIsSetupMode] = useState(true);
    const [setupTokenInput, setSetupTokenInput] = useState("");
    const [isValidatingToken, setIsValidatingToken] = useState(false);
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

        // Determine if it's check_in or check_out (simplified: if scanned today, check_out)
        // In a real scenario, we might want to check the server or have a more robust local check
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

    const fetchToken = useCallback(async (tokenToUse: string = kioskToken!) => {
        try {
            setLoading(true);
            if (!tokenToUse) return;

            const response = await api.get("kiosk/token", {
                headers: { "x-kiosk-token": tokenToUse }
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

    const validateToken = useCallback(async (token: string) => {
        try {
            setIsValidatingToken(true);
            const response = await api.get("kiosk/validate-token", {
                headers: { "x-kiosk-token": token }
            });

            if (response.data.valid) {
                localStorage.setItem("mosikola_kiosk_token", token);
                setKioskToken(token);
                setIsSetupMode(false);
                fetchToken(token);
            }
        } catch (error) {
            console.error("Token validation failed", error);
            localStorage.removeItem("mosikola_kiosk_token");
            setIsSetupMode(true);
            showNotification("error", "Token Kiosk tidak valid atau kadaluarsa");
        } finally {
            setIsValidatingToken(false);
            setLoading(false);
        }
    }, [fetchToken, showNotification]);

    const processNfcScan = useCallback(async (uid: string) => {
        if (!kioskToken || isSetupMode) return;

        // Offline-first lookup
        const student = students.find(s => s.nfc_uid === uid);
        if (student) {
            recordOfflineAttendance(student, 'nfc');
            return;
        }

        // Fallback or handle unknown
        showNotification("error", "Kartu tidak dikenali (NFC UID: " + uid + ")");
    }, [kioskToken, isSetupMode, students, recordOfflineAttendance, showNotification]);

    const processBarcodeScan = useCallback(async (nisn: string) => {
        if (!kioskToken || isSetupMode || isScanningBarcode) return;

        setIsScanningBarcode(true);
        setTimeout(() => setIsScanningBarcode(false), 3000);

        // Offline-first lookup
        const student = students.find(s => s.nisn === nisn);
        if (student) {
            recordOfflineAttendance(student, 'barcode');
            return;
        }

        // Fallback or handle unknown
        showNotification("error", "NISN tidak dikenali: " + nisn);
    }, [kioskToken, isSetupMode, isScanningBarcode, students, recordOfflineAttendance, showNotification]);

    const handleSetupSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!setupTokenInput.trim()) return;
        validateToken(setupTokenInput.trim());
    };

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

    const triggerReset = useCallback(() => {
        localStorage.removeItem("mosikola_kiosk_token");
        setKioskToken(null);
        setQrToken(null);
        setIsSetupMode(true);
        showNotification("success", "Kiosk berhasil di-reset");
        clickCountRef.current = { count: 0, lastClick: 0 };
        spaceCountRef.current = { count: 0, lastClick: 0 };
    }, [showNotification]);

    useEffect(() => {
        const storedToken = localStorage.getItem("mosikola_kiosk_token");
        const storedStudents = localStorage.getItem("mosikola_kiosk_students");
        const storedOutbox = localStorage.getItem("mosikola_kiosk_outbox");

        if (storedStudents) setStudents(JSON.parse(storedStudents));
        if (storedOutbox) setOutbox(JSON.parse(storedOutbox));

        if (storedToken) {
            validateToken(storedToken);
            fetchStudents(storedToken);
        } else {
            setIsSetupMode(true);
            setLoading(false);
        }
    }, [validateToken, fetchStudents]);

    // Idle-based batch sync (every 1 minute check)
    useEffect(() => {
        if (!kioskToken || isSetupMode) return;

        const syncInterval = setInterval(() => {
            const idleTime = Date.now() - lastActivityTime.current;
            const twentyMinutes = 20 * 60 * 1000;

            if (idleTime >= twentyMinutes && outbox.length > 0) {
                syncOutbox(kioskToken, outbox);
            }
        }, 60000); // Check every minute

        return () => clearInterval(syncInterval);
    }, [kioskToken, isSetupMode, outbox, syncOutbox]);

    useEffect(() => {
        if (!qrToken || isSetupMode) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    fetchToken();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [qrToken, isSetupMode, fetchToken]);

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
    }, [nfcInput, processNfcScan]);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Simple static notification - No Framer Motion */}
            {notification.show && (
                <div className={`absolute top-8 left-1/2 -translate-x-1/2 z-100 flex items-center gap-4 px-6 py-4 rounded-xl border ${notification.type === 'success' ? 'bg-green-900 border-green-500' :
                    notification.type === 'warning' ? 'bg-yellow-900 border-yellow-500' :
                        'bg-red-900 border-red-500'
                    }`}>
                    {notification.type === 'success' || notification.type === 'warning' ? (
                        <CheckCircle2 className={`w-8 h-8 ${notification.type === 'success' ? 'text-green-400' : 'text-yellow-400'}`} />
                    ) : (
                        <XCircle className="w-8 h-8 text-red-400" />
                    )}
                    <div className="text-left">
                        <h3 className="text-lg font-bold text-white">{notification.message}</h3>
                        {notification.student && <p className="text-sm text-white/80">{notification.student}</p>}
                    </div>
                </div>
            )}

            {isSetupMode ? (
                <div className="z-10 w-full max-w-md">
                    <Card className="border-slate-800 bg-slate-900 rounded-2xl overflow-hidden shadow-xl">
                        <div className="h-1 w-full bg-blue-600" />
                        <CardHeader className="text-center pb-2 pt-8">
                            <div className="mx-auto bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                                <ScanLine className="w-8 h-8 text-blue-400" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-white">Setup Anjungan Mosikola</CardTitle>
                            <p className="text-slate-400 text-sm">Masukan token tenant Mosikola.</p>
                        </CardHeader>
                        <CardContent className="pt-6 pb-8 px-8">
                            <form onSubmit={handleSetupSubmit} className="space-y-6">
                                <input
                                    type="password"
                                    autoFocus
                                    value={setupTokenInput}
                                    onChange={(e) => setSetupTokenInput(e.target.value)}
                                    placeholder="Kiosk Token"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-center font-mono"
                                    disabled={isValidatingToken || loading}
                                />
                                <button
                                    type="submit"
                                    disabled={isValidatingToken || loading || !setupTokenInput.trim()}
                                    className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg text-white font-bold transition-colors disabled:opacity-50"
                                >
                                    {(isValidatingToken || loading) ? "Memproses..." : "Aktifkan Kiosk"}
                                </button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="z-10 w-full max-w-6xl flex flex-col gap-8 items-center justify-center">
                    <div className="text-center">
                        <h1
                            className="text-4xl font-bold text-white cursor-pointer select-none"
                            onClick={handleLogoClick}
                        >
                            <span className="text-blue-500">Anjungan</span> Mosikola
                        </h1>
                        <p className="text-lg text-slate-400 mt-2">Scan barcode kartu siswa atau tempelkan kartu pintar.
                            <br />
                            <span className="text-xs text-slate-500">Atau scan QR Code di bawah ini lewat aplikasi Mosikola di HP Anda.</span>
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                        {/* QR Code */}
                        <Card className="border-slate-800 bg-slate-900 shadow-lg overflow-hidden">
                            <CardHeader className="bg-slate-800/50 py-3">
                                <CardTitle className="text-white flex justify-between items-center text-sm px-2">
                                    <span>Scan kode QR ini lewat aplikasi Mosikola</span>
                                    <span className="bg-slate-900 px-2 py-0.5 rounded text-xs font-mono">{timeLeft}s</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex justify-center p-8">
                                <div className="bg-white p-4 rounded-lg">
                                    {loading && !qrToken ? (
                                        <div className="w-[180px] h-[180px] flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
                                    ) : qrToken ? (
                                        <QRCodeSVG value={qrToken} size={180} />
                                    ) : (
                                        <div className="w-[180px] h-[180px] flex flex-col items-center justify-center text-slate-400 text-xs">
                                            <XCircle className="text-red-500 mb-2" />
                                            <span>Koneksi Gagal</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Scanner */}
                        <Card className="border-slate-800 bg-slate-900 shadow-lg overflow-hidden">
                            <CardHeader className="bg-slate-800/50 py-3">
                                <CardTitle className="text-white text-sm px-2">Perlihatkan ke kamera <i>barcode</i> / kode QR pada kartu siswa</CardTitle>
                            </CardHeader>
                            <CardContent className="flex justify-center p-8">
                                <div className="w-48 h-48 rounded-xl overflow-hidden bg-black border-2 border-slate-700">
                                    <QrScanner onScan={processBarcodeScan} facingMode="environment" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1"><ScanLine className="w-3 h-3" /> RFID Reader Ready</div>
                        <div className="w-1 h-1 bg-slate-700 rounded-full my-auto" />
                        <div>Low Memory Mode</div>
                    </div>
                </div>
            )}
        </div>
    );
}
