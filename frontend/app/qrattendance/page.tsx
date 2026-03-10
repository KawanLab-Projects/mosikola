"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "sonner"

// Dynamic import for Three.js component to avoid SSR issues
const ThreeBackground = dynamic(() => import("@/app/components/ThreeBackground"), { ssr: false })

export default function QRAttendancePage() {
    const [token, setToken] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [timeLeft, setTimeLeft] = useState(0)

    const fetchToken = async () => {
        try {
            setLoading(true)
            // Assuming this endpoint exists based on routes/api.php
            const response = await api.get("/api/attendance-token")
            setToken(response.data.data.token)
            const expiresAt = response.data.data.expires_at;
            const clientTime = Date.now();

            const expiresDate = new Date(expiresAt);
            const clientDate = new Date(clientTime);

            const difMs = expiresDate.getTime() - clientDate.getTime();

            const timeDiff = Math.round(difMs / 1000);
            setTimeLeft(timeDiff)
        } catch (error) {
            console.error("Failed to fetch token", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchToken()
    }, [])

    useEffect(() => {
        if (!token) return

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    fetchToken()
                }
                return prev - 1
            })

        }, 1000)
        return () => clearInterval(timer)
    }, [token])

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
            >
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">
                        Absensi QR Code
                    </h1>
                    <p className="text-slate-400">
                        Scan QR code ini untuk melakukan presensi
                    </p>
                </div>

                <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-white">
                            <span>QR Code</span>
                            <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-1 rounded-full">
                                Refresh dalam {timeLeft} detik
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-6 pt-6">
                        <div className="relative bg-white p-4 rounded-xl shadow-2xl shadow-purple-500/20">
                            {loading && !token ? (
                                <div className="w-[250px] h-[250px] flex items-center justify-center">
                                    <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
                                </div>
                            ) : token ? (
                                // Using a public API for QR generation for now.
                                // In a real app, you might use a library like 'qrcode.react'
                                <QRCodeSVG value={token} size={250} />
                            ) : (
                                <div className="w-[250px] h-[250px] flex items-center justify-center text-slate-400">
                                    Gagal memuat QR
                                </div>
                            )}
                        </div>

                        <Button
                            variant="outline"
                            className="w-full border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white"
                            disabled={loading}
                            onClick={() => toast.warning("Fitur ini sedang dalam pengembangan")}
                        >
                            <CreditCard className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Gunakan Kartu Siswa
                        </Button>
                    </CardContent>
                </Card>

                <div className="flex justify-center">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800/50">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali ke Dashboard
                        </Button>
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}
