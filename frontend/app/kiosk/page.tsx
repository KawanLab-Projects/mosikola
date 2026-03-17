"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ScanLine, XCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import dynamic from "next/dynamic";
import QrScanner from "@/app/components/QrScanner";
import KioskInfoScreen, { RecentScan } from "@/app/components/KioskInfoScreen";
import { format } from "date-fns";

// Dynamic import for Three.js component to avoid SSR issues
const ThreeBackground = dynamic(() => import("@/app/components/ThreeBackground"), { ssr: false })

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
    type: "check_in" | "check_out";
    method: "nfc" | "barcode" | "offline";
    timestamp: string;
}

export default function KioskPage() {
    const [kioskToken, setKioskToken] = useState<string | null>(null);
    const [qrToken, setQrToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);
    const [nfcInput, setNfcInput] = useState("");
    const [isScanningBarcode, setIsScanningBarcode] = useState(false);

    // Offline-first states
    const [students, setStudents] = useState<Student[]>([]);
    const [outbox, setOutbox] = useState<OutboxRecord[]>([]);
    const isSyncing = useRef(false);

    // Idle / info-display mode
    const [isIdleMode, setIsIdleMode] = useState(false);
    const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const outboxRef = useRef(outbox);
    const [inactivityTimeoutMinutes, setInactivityTimeoutMinutes] = useState(20);
    const [schoolEndTime, setSchoolEndTime] = useState("14:00");

    // Setup mode states
    const [isSetupMode, setIsSetupMode] = useState(true);
    const [setupTokenInput, setSetupTokenInput] = useState("");
    const [isValidatingToken, setIsValidatingToken] = useState(false);
    const clickCountRef = useRef({ count: 0, lastClick: 0 });

    // Notification state
    const [notification, setNotification] = useState<{
        show: boolean;
        type: "success" | "error" | "warning";
        message: string;
        student?: string;
    }>({ show: false, type: "success", message: "" });

    const notificationTimeout = useRef<NodeJS.Timeout | null>(null);

    // Keep outboxRef in sync
    useEffect(() => { outboxRef.current = outbox; }, [outbox]);

    const showNotification = useCallback((type: "success" | "error" | "warning", message: string, student?: string) => {
        setNotification({ show: true, type, message, student });
        if (notificationTimeout.current) clearTimeout(notificationTimeout.current);
        notificationTimeout.current = setTimeout(() => {
            setNotification((prev) => ({ ...prev, show: false }));
        }, 5000);
    }, []);

    const fetchToken = useCallback(async (tokenToUse: string = kioskToken!) => {
        try {
            setLoading(true);
            if (!tokenToUse) return;
            const response = await api.get("/kiosk/token", {
                headers: { "x-kiosk-token": tokenToUse }
            });
            setQrToken(response.data.token);
            const expiresDate = new Date(response.data.expires_at);
            const timeDiff = Math.max(0, Math.round((expiresDate.getTime() - Date.now()) / 1000));
            setTimeLeft(timeDiff);

            // Auto-update settings if provided
            if (response.data.settings) {
                const { inactivity_timeout_minutes, school_end_time } = response.data.settings;
                if (inactivity_timeout_minutes) setInactivityTimeoutMinutes(Number(inactivity_timeout_minutes));
                if (school_end_time) setSchoolEndTime(school_end_time);
                
                localStorage.setItem("mosikola_kiosk_settings", JSON.stringify({ 
                    timeout: inactivity_timeout_minutes, 
                    end: school_end_time 
                }));
            }
        } catch {
            showNotification("error", "Gagal memuat token Kiosk. Periksa koneksi.");
        } finally {
            setLoading(false);
        }
    }, [kioskToken, showNotification]);

    const fetchStudents = useCallback(async (token: string) => {
        try {
            const response = await api.get("/kiosk/students", {
                headers: { "x-kiosk-token": token }
            });
            const data = response.data.data;
            setStudents(data);
            localStorage.setItem("mosikola_kiosk_students", JSON.stringify(data));
        } catch {
            const cached = localStorage.getItem("mosikola_kiosk_students");
            if (cached) setStudents(JSON.parse(cached));
        }
    }, []);

    const syncOutbox = useCallback(async (token: string, records: OutboxRecord[]) => {
        if (records.length === 0 || isSyncing.current) return;
        try {
            isSyncing.current = true;
            await api.post("/kiosk/attendance/batch", { records }, {
                headers: { "x-kiosk-token": token }
            });
            setOutbox([]);
            localStorage.setItem("mosikola_kiosk_outbox", "[]");
            showNotification("success", "Sinkronisasi data berhasil");
        } catch {
            console.error("Sync failed");
        } finally {
            isSyncing.current = false;
        }
    }, [showNotification]);

    // Precise idle timer — resets on any activity, triggers info mode when it fires
    const kioskTokenRef = useRef(kioskToken);
    useEffect(() => { kioskTokenRef.current = kioskToken; }, [kioskToken]);

    const resetIdleTimer = useCallback((timeoutMinutes: number) => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        setIsIdleMode(false);
        idleTimerRef.current = setTimeout(() => {
            setIsIdleMode(true);
        }, timeoutMinutes * 60 * 1000);
    }, []);

    // Force sync on inactivity if idle mode is already active but outbox is not empty
    useEffect(() => {
        if (isIdleMode && outbox.length > 0 && kioskToken) {
            syncOutbox(kioskToken, outbox);
        }
    }, [isIdleMode, outbox, kioskToken, syncOutbox]);

    const recordOfflineAttendance = useCallback((student: Student, method: "nfc" | "barcode" | "offline") => {
        // Wake from idle immediately
        setIsIdleMode(false);
        resetIdleTimer(inactivityTimeoutMinutes);

        const now = new Date();
        const currentTime = format(now, "HH:mm");
        const isAfterSchool = currentTime >= schoolEndTime;
        const type = isAfterSchool ? "check_out" : "check_in";

        const today = now.toISOString().split("T")[0];
        const alreadyScanned = outboxRef.current.find(r => 
            r.student_id === student.id && 
            r.timestamp.startsWith(today) && 
            r.type === type
        );

        if (alreadyScanned) {
            showNotification("warning", `Sudah melakukan absensi ${type === "check_in" ? "masuk" : "pulang"} hari ini.`, student.name);
            return;
        }

        const newRecord: OutboxRecord = {
            student_id: student.id,
            student_name: student.name,
            type,
            method,
            timestamp: now.toISOString(),
        };

        const updatedOutbox = [...outboxRef.current, newRecord];
        setOutbox(updatedOutbox);
        localStorage.setItem("mosikola_kiosk_outbox", JSON.stringify(updatedOutbox));

        // Add to recent scans feed
        const scan: RecentScan = {
            name: student.name,
            type,
            method,
            timeStr: format(new Date(), "HH:mm"),
        };
        setRecentScans(prev => [scan, ...prev].slice(0, 10));

        showNotification("success", `Berhasil Check-${type === "check_in" ? "In" : "Out"} (Offline)`, student.name);
    }, [inactivityTimeoutMinutes, resetIdleTimer, showNotification, schoolEndTime]);

    const validateToken = useCallback(async (token: string) => {
        try {
            setIsValidatingToken(true);
            const response = await api.get("/kiosk/validate-token", {
                headers: { "x-kiosk-token": token }
            });
            if (response.data.valid) {
                localStorage.setItem("mosikola_kiosk_token", token);
                setKioskToken(token);
                setIsSetupMode(false);
                
                const timeout = response.data.inactivity_timeout_minutes ? Number(response.data.inactivity_timeout_minutes) : 20;
                const end = response.data.school_end_time || "14:00";

                setInactivityTimeoutMinutes(timeout);
                setSchoolEndTime(end);

                localStorage.setItem("mosikola_kiosk_settings", JSON.stringify({ timeout, end }));

                resetIdleTimer(timeout);
                fetchToken(token);
                fetchStudents(token);
            }
        } catch {
            localStorage.removeItem("mosikola_kiosk_token");
            setIsSetupMode(true);
            showNotification("error", "Token Kiosk tidak valid atau kadaluarsa");
        } finally {
            setIsValidatingToken(false);
            setLoading(false);
        }
    }, [fetchToken, fetchStudents, resetIdleTimer, showNotification]);

    const processNfcScan = useCallback((uid: string) => {
        if (!kioskToken || isSetupMode) return;
        const student = students.find(s => s.nfc_uid === uid);
        if (student) { recordOfflineAttendance(student, "nfc"); return; }
        showNotification("error", "Kartu tidak dikenali (NFC UID: " + uid + ")");
    }, [kioskToken, isSetupMode, students, recordOfflineAttendance, showNotification]);

    const processBarcodeScan = useCallback((nisn: string) => {
        if (!kioskToken || isSetupMode || isScanningBarcode) return;
        setIsScanningBarcode(true);
        setTimeout(() => setIsScanningBarcode(false), 3000);
        const student = students.find(s => s.nisn === nisn);
        if (student) { recordOfflineAttendance(student, "barcode"); return; }
        showNotification("error", "NISN tidak dikenali: " + nisn);
    }, [kioskToken, isSetupMode, isScanningBarcode, students, recordOfflineAttendance, showNotification]);

    const handleSetupSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!setupTokenInput.trim()) return;
        validateToken(setupTokenInput.trim());
    };

    const triggerReset = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        localStorage.removeItem("mosikola_kiosk_token");
        localStorage.removeItem("mosikola_kiosk_students");
        localStorage.removeItem("mosikola_kiosk_outbox");
        setKioskToken(null);
        setQrToken(null);
        setStudents([]);
        setOutbox([]);
        setIsIdleMode(false);
        setIsSetupMode(true);
        showNotification("success", "Kiosk berhasil di-reset");
        clickCountRef.current = { count: 0, lastClick: 0 };
    }, [showNotification]);

    const handleLogoClick = () => {
        const now = Date.now();
        const { count, lastClick } = clickCountRef.current;
        if (now - lastClick > 1000) { clickCountRef.current = { count: 1, lastClick: now }; return; }
        const newCount = count + 1;
        clickCountRef.current = { count: newCount, lastClick: now };
        if (newCount >= 5) triggerReset();
    };

    // On mount: restore from localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem("mosikola_kiosk_token");
        const storedStudents = localStorage.getItem("mosikola_kiosk_students");
        const storedOutbox = localStorage.getItem("mosikola_kiosk_outbox");
        if (storedStudents) setStudents(JSON.parse(storedStudents));
        if (storedOutbox) setOutbox(JSON.parse(storedOutbox));
        if (storedToken) {
            setKioskToken(storedToken);
            setIsSetupMode(false);

            const savedSettings = localStorage.getItem("mosikola_kiosk_settings");
            if (savedSettings) {
                const { timeout, end } = JSON.parse(savedSettings);
                setInactivityTimeoutMinutes(timeout || 20);
                setSchoolEndTime(end || "14:00");
                resetIdleTimer(timeout || 20);
            }

            fetchToken(storedToken);
            fetchStudents(storedToken);
        } else {
            setIsSetupMode(true);
            setLoading(false);
        }
    }, [validateToken, fetchToken, fetchStudents, resetIdleTimer]);

    // QR timer countdown
    useEffect(() => {
        if (!qrToken || isSetupMode) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) { fetchToken(); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [qrToken, isSetupMode, fetchToken]);

    // NFC keyboard-wedge input
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === "Enter") {
                if (nfcInput.length > 0) { processNfcScan(nfcInput); setNfcInput(""); }
            } else if (e.key.length === 1) {
                setNfcInput(prev => prev + e.key);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [nfcInput, processNfcScan]);

    // ── Mini attendance widget (shared between idle and full mode) ────────────
    const miniAttendanceWidget = (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden w-[260px]">
            <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <span className="text-white text-xs font-bold tracking-wider uppercase">Anjungan</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${timeLeft < 5 ? "bg-red-500/20 text-red-400" : "bg-slate-800 text-slate-400"}`}>
                    QR {timeLeft}s
                </span>
            </div>
            <div className="flex gap-3 p-3">
                {/* Mini QR */}
                <div className="bg-white rounded-lg p-1.5 shrink-0">
                    {loading && !qrToken ? (
                        <div className="w-[80px] h-[80px] flex items-center justify-center">
                            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                        </div>
                    ) : qrToken ? (
                        <QRCodeSVG value={qrToken} size={80} level="M" includeMargin={false} />
                    ) : (
                        <div className="w-[80px] h-[80px] flex flex-col items-center justify-center text-slate-400 gap-1 text-center">
                            <XCircle className="w-5 h-5 text-red-400" />
                            <span className="text-[9px]">Gagal</span>
                        </div>
                    )}
                </div>
                {/* Mini camera */}
                <div className="flex-1 rounded-lg overflow-hidden bg-black border border-slate-700 relative" style={{ height: 97 }}>
                    <QrScanner id="mini-scanner" onScan={processBarcodeScan} facingMode="environment" />
                    <motion.div
                        className="absolute inset-x-0 h-0.5 bg-green-500/60 pointer-events-none"
                        animate={{ top: ["10%", "90%", "10%"] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                    />
                </div>
            </div>
            <div className="px-3 pb-2.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-slate-500 text-[10px]">NFC Reader Ready</span>
                {outbox.length > 0 && (
                    <span className="ml-auto text-amber-400 text-[10px] bg-amber-400/10 px-1.5 py-0.5 rounded">
                        {outbox.length} pending
                    </span>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* ── INFO / SCREENSAVER MODE ── */}
            <AnimatePresence>
                {!isSetupMode && isIdleMode && (
                    <motion.div
                        key="info-screen"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <KioskInfoScreen
                            recentScans={recentScans}
                            outboxCount={outbox.length}
                            miniContent={miniAttendanceWidget}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── FULL ATTENDANCE MODE ── */}
            {(!isIdleMode || isSetupMode) && (
                <div className={`min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-blue-500/30`}>
                <ThreeBackground />

                {/* Notification overlay */}
                <AnimatePresence>
                    {notification.show && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            className={`absolute top-8 left-1/2 -translate-x-1/2 z-100 flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${
                                notification.type === "success" ? "bg-green-950/90 border-green-500/30" :
                                notification.type === "warning" ? "bg-yellow-950/90 border-yellow-500/30" :
                                "bg-red-950/90 border-red-500/30"
                            }`}
                        >
                            {notification.type === "success" ? (
                                <CheckCircle2 className="w-8 h-8 text-green-400" />
                            ) : notification.type === "warning" ? (
                                <CheckCircle2 className="w-8 h-8 text-yellow-400" />
                            ) : (
                                <XCircle className="w-8 h-8 text-red-400" />
                            )}
                            <div className="text-left">
                                <h3 className="text-lg font-bold text-white">{notification.message}</h3>
                                {notification.student && <p className="text-sm text-white/80">{notification.student}</p>}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {isSetupMode ? (
                    /* SETUP MODE */
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="z-10 w-full max-w-md mt-[-10vh]"
                    >
                        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden rounded-3xl">
                            <div className="h-2 w-full bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500" />
                            <CardHeader className="text-center pb-2 pt-8">
                                <div className="mx-auto bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-700/50">
                                    <ScanLine className="w-10 h-10 text-blue-400" />
                                </div>
                                <p className="text-3xl font-bold tracking-tight text-white mb-2">Setup Kiosk</p>
                                <p className="text-slate-400 text-sm">
                                    Masukkan token rahasia tenant Anda untuk mengaktifkan mesin anjungan mandiri ini.
                                </p>
                            </CardHeader>
                            <CardContent className="pt-6 pb-8 px-8">
                                <form onSubmit={handleSetupSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label htmlFor="token" className="text-xs font-semibold uppercase tracking-wider text-slate-400 ml-1">Kiosk Token</label>
                                        <input
                                            id="token"
                                            type="password"
                                            autoFocus
                                            value={setupTokenInput}
                                            onChange={(e) => setSetupTokenInput(e.target.value)}
                                            placeholder="sk_test_..."
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono tracking-widest text-center"
                                            disabled={isValidatingToken || loading}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isValidatingToken || loading || !setupTokenInput.trim()}
                                        className="w-full relative group overflow-hidden rounded-xl bg-blue-600 px-4 py-3 text-white font-medium transition-all hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                                    >
                                        <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="relative flex justify-center items-center gap-2">
                                            {(isValidatingToken || loading) ? (
                                                <><Loader2 className="w-5 h-5 animate-spin" /> Memvalidasi...</>
                                            ) : "Aktifkan Kiosk"}
                                        </span>
                                    </button>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    /* KIOSK ACTIVE MODE */
                    <div className="z-10 w-full max-w-6xl flex flex-col gap-12 items-center justify-center">
                        <div className="space-y-6 text-center flex flex-col items-center">
                            <h1
                                className="text-4xl md:text-5xl font-bold tracking-tighter text-white drop-shadow-sm cursor-pointer select-none"
                                onClick={handleLogoClick}
                                title="Tap 5x to reset kiosk"
                            >
                                <span className="text-blue-500">Anjungan</span> Mosikola
                            </h1>
                            <p className="text-xl text-slate-400 max-w-2xl">
                                Silahkan scan QR Code/Barcode dari Kartu Pelajar, atau gunakan aplikasi siswa, atau tap reader NFC.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-6 mt-6 w-full max-w-3xl">
                                <div className="flex items-center flex-1 gap-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800 backdrop-blur-md shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                                    <div className="bg-blue-500/10 p-3 rounded-xl text-blue-400"><ScanLine className="w-7 h-7" /></div>
                                    <div className="text-left">
                                        <p className="text-white font-medium text-lg">Aplikasi Mosikola</p>
                                        <p className="text-slate-400 text-sm">Arahkan kamera ke QR Code</p>
                                    </div>
                                </div>
                                <div className="flex items-center flex-1 gap-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800 backdrop-blur-md shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                                    <div className="bg-purple-500/10 p-3 rounded-xl text-purple-400">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-white font-medium text-lg">Kartu Siswa (NFC)</p>
                                        <p className="text-slate-400 text-sm">Tempel kartu pada reader</p>
                                    </div>
                                </div>
                            </div>
                            {outbox.length > 0 && (
                                <div className="flex items-center gap-1.5 text-amber-400 text-xs bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/20">
                                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                                    {outbox.length} data belum tersinkronisasi
                                </div>
                            )}
                        </div>

                        <div className="relative w-full max-w-4xl mt-4">
                            <div className="flex flex-col md:flex-row items-stretch justify-center gap-8 w-full">
                                {/* Primary QR Display */}
                                <Card className="flex-1 w-full max-w-sm mx-auto border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-slate-700">
                                    <CardHeader className="text-center pb-2 bg-slate-900/40">
                                        <CardTitle className="text-white flex justify-between items-center text-lg">
                                            <span>Scan QR Code</span>
                                            <span className={`text-xs px-2 py-1 rounded-full font-mono font-medium ${timeLeft < 5 ? "bg-red-500/20 text-red-400" : "bg-slate-800 text-slate-300"}`}>
                                                {timeLeft}s
                                            </span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex flex-col items-center gap-6 pt-6 pb-8">
                                        <div className="relative bg-white p-5 rounded-2xl shadow-xl transition-all duration-300 hover:scale-105">
                                            {loading && !qrToken ? (
                                                <div className="w-[200px] h-[200px] flex items-center justify-center">
                                                    <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
                                                </div>
                                            ) : qrToken ? (
                                                <QRCodeSVG value={qrToken} size={200} level="H" includeMargin={false} />
                                            ) : (
                                                <div className="w-[200px] h-[200px] flex flex-col items-center justify-center text-slate-400 gap-2 text-center">
                                                    <XCircle className="w-8 h-8 text-red-400" />
                                                    <span>Gagal terhubung ke server</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Camera Scanner */}
                                <Card className="flex-1 w-full max-w-sm mx-auto border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-slate-700">
                                    <CardHeader className="text-center pb-2 bg-slate-900/40">
                                        <CardTitle className="text-white text-lg">Kamera Barcode</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
                                        <div className="w-56 h-56 md:w-60 md:h-60 overflow-hidden rounded-2xl border-4 border-slate-800 relative bg-black shadow-inner">
                                            <QrScanner id="full-scanner" onScan={processBarcodeScan} facingMode="environment" />
                                            <motion.div
                                                className="absolute inset-x-0 h-1 bg-green-500/50 shadow-[0_0_20px_bg-green-500] pointer-events-none rounded-full mx-4 z-10"
                                                animate={{ top: ["10%", "90%", "10%"] }}
                                                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}
                </div>
            )}
        </>
    );
}
