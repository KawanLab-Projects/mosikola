"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ScanLine, XCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import dynamic from "next/dynamic";
import QrScanner from "@/app/components/QrScanner";

// Dynamic import for Three.js component to avoid SSR issues
const ThreeBackground = dynamic(() => import("@/app/components/ThreeBackground"), { ssr: false })

export default function KioskPage() {
    const params = useParams();
    const kioskToken = params?.token as string;

    const [qrToken, setQrToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);
    const [nfcInput, setNfcInput] = useState("");
    const [isScanningBarcode, setIsScanningBarcode] = useState(false);

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
        }, 5000); // Hide after 5 seconds
    }, []);

    const fetchToken = useCallback(async () => {
        try {
            setLoading(true);
            if (!kioskToken) {
                console.error("No kiosk token found in URL");
                return;
            }
            const response = await api.get("/kiosk/token", {
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
            showNotification("error", "Gagal memuat token Kiosk. Periksa koneksi atau token tidak valid.");
        } finally {
            setLoading(false);
        }
    }, [kioskToken, showNotification]);

    const processNfcScan = useCallback(async (uid: string) => {
        try {
            if (!kioskToken) return;
            const response = await api.post("/kiosk/attendance/nfc", {
                nfc_uid: uid
            }, {
                headers: { "x-kiosk-token": kioskToken }
            });

            const data = response.data;
            showNotification("success", `Berhasil Check-${data.type === 'check_in' ? 'In' : 'Out'}`, data.student);
        } catch (error: unknown) {
            import("axios").then(({ isAxiosError }) => {
                if (isAxiosError(error)) {
                    if (error.response?.status === 409) {
                        showNotification("warning", "Sudah melakukan Check-Out hari ini");
                    } else {
                        showNotification("error", error.response?.data?.message || "Kartu tidak dikenali");
                    }
                } else {
                    showNotification("error", "Terjadi kesalahan yang tidak terduga");
                }
            });
        }
    }, [kioskToken, showNotification]);

    const processBarcodeScan = useCallback(async (nisn: string) => {
        if (isScanningBarcode) return;

        // Anti-spam buffer
        setIsScanningBarcode(true);
        setTimeout(() => setIsScanningBarcode(false), 3000);

        try {
            if (!kioskToken) return;
            const response = await api.post("/kiosk/attendance/camera-barcode", {
                nisn: nisn
            }, {
                headers: { "x-kiosk-token": kioskToken }
            });

            const data = response.data;
            showNotification("success", `Berhasil Check-${data.type === 'check_in' ? 'In' : 'Out'}`, data.student);
        } catch (error: unknown) {
            import("axios").then(({ isAxiosError }) => {
                if (isAxiosError(error)) {
                    if (error.response?.status === 409) {
                        showNotification("warning", "Sudah melakukan Check-Out hari ini");
                    } else {
                        showNotification("error", error.response?.data?.message || "Barcode tidak dikenali");
                    }
                } else {
                    showNotification("error", "Terjadi kesalahan yang tidak terduga");
                }
            });
        }
    }, [kioskToken, isScanningBarcode, showNotification]);

    useEffect(() => {
        if (kioskToken) {
            fetchToken();
        }
    }, [kioskToken, fetchToken]);

    useEffect(() => {
        if (!qrToken) return;

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
    }, [qrToken, fetchToken]);

    // Handle NFC Scanner Input (Keyboard wedge)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if focus is in an input field
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (e.key === "Enter") {
                if (nfcInput.length > 0) {
                    processNfcScan(nfcInput);
                    setNfcInput(""); // Reset for next scan
                }
            } else if (e.key.length === 1) { // Normal character
                setNfcInput(prev => prev + e.key);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [nfcInput, processNfcScan]);


    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* 3D Background */}
            <ThreeBackground />



            {/* Content with Framer Motion Animation */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="z-10 w-full max-w-md space-y-8"
            ></motion.div>

            <div className="z-10 w-full max-w-6xl flex flex-col gap-12 items-center justify-center">

                {/* Top Side: Instructions / Brand */}
                <div className="space-y-6 text-center flex flex-col items-center">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white drop-shadow-sm">
                        <span className="text-blue-500">Anjungan</span> Mosikola
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl">
                        Silahkan scan QR Code/Barcode dari Kartu Pelajar, atau gunakan aplikasi siswa, atau tap reader NFC.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-6 mt-6 w-full max-w-3xl">
                        <div className="flex items-center flex-1 gap-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800 backdrop-blur-md shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                            <div className="bg-blue-500/10 p-3 rounded-xl text-blue-400">
                                <ScanLine className="w-7 h-7" />
                            </div>
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
                </div>

                {/* Center Side: Scanners Side by Side */}
                <div className="relative w-full max-w-4xl mt-4">
                    {/* Status Notification Overlay (Global for both scanners) */}
                    <AnimatePresence>
                        {notification.show && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-8 text-center backdrop-blur-xl rounded-2xl shadow-2xl ${notification.type === 'success' ? 'bg-green-950/80 border border-green-500/50' :
                                    notification.type === 'warning' ? 'bg-yellow-950/80 border border-yellow-500/50' :
                                        'bg-red-950/80 border border-red-500/50'
                                    }`}
                            >
                                {notification.type === 'success' ? (
                                    <CheckCircle2 className="w-24 h-24 text-green-400 mb-6 drop-shadow-[0_0_15px_rgba(74,222,128,0.3)]" />
                                ) : notification.type === 'warning' ? (
                                    <CheckCircle2 className="w-24 h-24 text-yellow-400 mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]" />
                                ) : (
                                    <XCircle className="w-24 h-24 text-red-400 mb-6 drop-shadow-[0_0_15px_rgba(248,113,113,0.3)]" />
                                )}

                                <h3 className="text-3xl font-bold text-white mb-2">
                                    {notification.message}
                                </h3>
                                {notification.student && (
                                    <p className="text-xl text-white/90 font-medium mt-2">{notification.student}</p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex flex-col md:flex-row items-stretch justify-center gap-8 w-full">
                        {/* Primary QR Display */}
                        <Card className="flex-1 w-full max-w-sm mx-auto border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-slate-700">
                            <CardHeader className="text-center pb-2 bg-slate-900/40">
                                <CardTitle className="text-white flex justify-between items-center text-lg">
                                    <span>Scan QR Code</span>
                                    <span className={`text-xs px-2 py-1 rounded-full font-mono font-medium ${timeLeft < 5 ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-300'}`}>
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
                                <CardTitle className="text-white text-lg">
                                    Kamera Barcode
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
                                <div className="w-56 h-56 md:w-60 md:h-60 overflow-hidden rounded-2xl border-4 border-slate-800 relative bg-black shadow-inner">
                                    <QrScanner id="kiosk-token-scanner" onScan={processBarcodeScan} facingMode="environment" />
                                    {/* Scanning Animation line */}
                                    <motion.div
                                        className="absolute inset-x-0 h-1 bg-green-500/50 shadow-[0_0_20px_bg-green-500] pointer-events-none rounded-full mx-4 z-10"
                                        animate={{
                                            top: ["10%", "90%", "10%"],
                                        }}
                                        transition={{
                                            duration: 2.5,
                                            repeat: Infinity,
                                            ease: "linear",
                                        }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

        </div>
    );
}
