"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, LogOut, Wifi, WifiOff } from "lucide-react";

export interface RecentScan {
    name: string;
    type: "check_in" | "check_out";
    timeStr: string;
    method: "nfc" | "barcode" | "offline";
}

type Corner = "tl" | "tr" | "bl" | "br";

const CORNER_CYCLE: Corner[] = ["br", "bl", "tr", "tl"];

const cornerClass: Record<Corner, string> = {
    tl: "top-6 left-6",
    tr: "top-6 right-6",
    bl: "bottom-6 left-6",
    br: "bottom-6 right-6",
};

interface Props {
    recentScans: RecentScan[];
    outboxCount: number;
    isOnline?: boolean;
    miniContent: React.ReactNode; // QR + camera slot
}

const QUOTES = [
    "Disiplin adalah jembatan antara tujuan dan pencapaian.",
    "Kehadiran tepat waktu adalah tanda menghargai diri sendiri.",
    "Karakter dibangun dari kebiasaan sehari-hari.",
    "Kedisiplinan hari ini menciptakan kebebasan masa depan.",
    "Hadir, semangat, dan jadilah yang terbaik hari ini!",
];

export default function KioskInfoScreen({
    recentScans,
    outboxCount,
    isOnline = true,
    miniContent,
}: Props) {
    const [now, setNow] = useState(new Date());
    const [corner, setCorner] = useState<Corner>("br");
    const [quoteIdx, setQuoteIdx] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const quoteTimer = setInterval(() => {
            setQuoteIdx((prev) => (prev + 1) % QUOTES.length);
        }, 8000);
        return () => clearInterval(quoteTimer);
    }, []);

    const cycleCorner = useCallback(() => {
        setCorner((prev) => {
            const idx = CORNER_CYCLE.indexOf(prev);
            return CORNER_CYCLE[(idx + 1) % CORNER_CYCLE.length];
        });
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-slate-950 overflow-hidden select-none">
            {/* Animated background orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute w-[600px] h-[600px] rounded-full opacity-10 blur-3xl"
                    style={{
                        background: "radial-gradient(circle, #3b82f6, transparent)",
                        top: "-10%",
                        left: "-10%",
                        animation: "orbFloat1 20s ease-in-out infinite alternate",
                    }}
                />
                <div
                    className="absolute w-[400px] h-[400px] rounded-full opacity-8 blur-3xl"
                    style={{
                        background: "radial-gradient(circle, #8b5cf6, transparent)",
                        bottom: "-5%",
                        right: "20%",
                        animation: "orbFloat2 25s ease-in-out infinite alternate",
                    }}
                />
                <div
                    className="absolute w-[300px] h-[300px] rounded-full opacity-6 blur-3xl"
                    style={{
                        background: "radial-gradient(circle, #06b6d4, transparent)",
                        top: "40%",
                        right: "-5%",
                        animation: "orbFloat1 18s ease-in-out infinite alternate-reverse",
                    }}
                />
            </div>

            <style>{`
                @keyframes orbFloat1 {
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(40px, 60px) scale(1.1); }
                }
                @keyframes orbFloat2 {
                    0% { transform: translate(0, 0) scale(1.1); }
                    100% { transform: translate(-50px, -30px) scale(1); }
                }
                @keyframes scanPulse {
                    0%, 100% { opacity: 0.6; transform: scaleX(1); }
                    50% { opacity: 1; transform: scaleX(1.02); }
                }
            `}</style>

            {/* Main content — centered */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full gap-8 px-12">
                {/* Clock */}
                <div className="text-center">
                    <div
                        className="font-mono font-bold text-white tabular-nums tracking-tight"
                        style={{ fontSize: "clamp(4rem, 12vw, 9rem)", lineHeight: 1 }}
                    >
                        {format(now, "HH:mm:ss")}
                    </div>
                    <p className="text-slate-400 mt-3 capitalize text-xl md:text-2xl">
                        {format(now, "EEEE, dd MMMM yyyy", { locale: localeId })}
                    </p>
                </div>

                {/* Animated quote */}
                <AnimatePresence mode="wait">
                    <motion.p
                        key={quoteIdx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.6 }}
                        className="text-slate-500 text-base md:text-lg text-center max-w-xl italic"
                    >
                        &ldquo;{QUOTES[quoteIdx]}&rdquo;
                    </motion.p>
                </AnimatePresence>

                {/* CTA */}
                <div
                    className="flex items-center gap-3 px-6 py-3 rounded-full border border-blue-500/30 bg-blue-500/10"
                    style={{ animation: "scanPulse 3s ease-in-out infinite" }}
                >
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-blue-300 font-medium text-base md:text-lg">
                        Tempelkan kartu atau scan barcode untuk absen
                    </span>
                </div>

                {/* Recent scans */}
                <AnimatePresence>
                    {recentScans.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full max-w-lg"
                        >
                            <p className="text-slate-600 text-xs uppercase tracking-widest text-center mb-3">
                                Absensi Terbaru
                            </p>
                            <div className="flex flex-col gap-2">
                                <AnimatePresence>
                                    {recentScans.slice(0, 5).map((scan, i) => (
                                        <motion.div
                                            key={`${scan.name}-${scan.timeStr}-${i}`}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="flex items-center justify-between px-4 py-2.5 bg-slate-900/70 backdrop-blur-sm rounded-xl border border-slate-800"
                                        >
                                            <div className="flex items-center gap-3">
                                                {scan.type === "check_in" ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                                                ) : (
                                                    <LogOut className="w-4 h-4 text-blue-400 shrink-0" />
                                                )}
                                                <span className="text-white font-medium text-sm">
                                                    {scan.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                        scan.type === "check_in"
                                                            ? "bg-green-500/15 text-green-400"
                                                            : "bg-blue-500/15 text-blue-400"
                                                    }`}
                                                >
                                                    {scan.type === "check_in" ? "Masuk" : "Keluar"}
                                                </span>
                                                <span className="text-slate-600 text-xs tabular-nums">
                                                    {scan.timeStr}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Status bar — bottom center */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
                {outboxCount > 0 && (
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                        {outboxCount} data belum tersinkronisasi
                    </div>
                )}
                <div
                    className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border ${
                        isOnline
                            ? "text-green-400 bg-green-400/10 border-green-400/20"
                            : "text-red-400 bg-red-400/10 border-red-400/20"
                    }`}
                >
                    {isOnline ? (
                        <Wifi className="w-3 h-3" />
                    ) : (
                        <WifiOff className="w-3 h-3" />
                    )}
                    {isOnline ? "Online" : "Offline"}
                </div>
            </div>

            {/* Mini attendance widget — click to cycle corner */}
            <motion.div
                layout
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`absolute z-20 ${cornerClass[corner]}`}
            >
                <div
                    className="cursor-pointer group relative"
                    onClick={cycleCorner}
                    title="Klik untuk pindah posisi"
                >
                    {/* Reposition indicator */}
                    <div className="absolute inset-0 rounded-2xl ring-2 ring-blue-500/0 group-hover:ring-blue-500/40 transition-all duration-200 pointer-events-none z-10" />
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 text-slate-400">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="m5 9-3 3 3 3" /><path d="m19 9 3 3-3 3" /><path d="M2 12h20" /><path d="m9 5 3-3 3 3" /><path d="m9 19 3 3 3-3" /><path d="M12 2v20" />
                        </svg>
                    </div>
                    {miniContent}
                </div>
            </motion.div>
        </div>
    );
}
