"use client"

import { useState } from "react"
import QrScanner from "@/app/components/QrScanner"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { RotateCcw } from "lucide-react"

export default function StudentDashboard() {
    const [facingMode, setFacingMode] = useState<"environment" | "user">(
        "environment"
    )

    const handleScan = async (token: string) => {
        try {
            const res = await api.post("/api/record-attendance", {
                attendance_token: token,
            })

            const data = res.data.data

            if (data === "attendance_recorded") {
                toast.success("Terima Kasih, Absen anda telah dicatat")
            } else if (data === "token_is_invalid") {
                toast.error("Token tidak valid")
            } else {
                toast.warning("Anda sudah melakukan absensi hari ini")
            }
        } catch {
            toast.error("Gagal menghubungi server")
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-center">
                <div className="w-full max-w-sm rounded-2xl border bg-white shadow-lg p-4">
                    <h2 className="text-center font-semibold text-lg mb-2">
                        Scan QR Absensi
                    </h2>

                    <div className="relative aspect-square rounded-xl overflow-hidden bg-black">
                        <QrScanner
                            id="student-dashboard-scanner"
                            onScan={handleScan}
                            facingMode={facingMode}
                        />

                        {/* Overlay */}
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute inset-0 bg-black/40" />
                            <div className="absolute inset-1/2 w-64 h-64 -translate-x-1/2 -translate-y-1/2">
                                <div className="absolute inset-0 border-2 border-green-400 rounded-lg" />
                            </div>
                        </div>

                        {/* Tombol ganti kamera */}
                        <button
                            onClick={() =>
                                setFacingMode((prev) =>
                                    prev === "environment"
                                        ? "user"
                                        : "environment"
                                )
                            }
                            className="absolute bottom-3 right-3 z-10 rounded-full bg-black/70 p-3 text-white backdrop-blur"
                        >
                            <RotateCcw size={20} />
                        </button>
                    </div>

                    <p className="mt-3 text-center text-sm text-muted-foreground">
                        Arahkan QR Code ke dalam kotak
                    </p>
                </div>
            </div>
        </div>
    )
}
