"use client"

import { LoginForm } from "@/app/components/auth/LoginForm";
import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Shield, Check, User } from "lucide-react";

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = async (data: { user: string, password: string }) => {
        setIsLoading(true)

        try {
            const response = await api.post("/auth/login", data)

            const { token, user } = response.data

            // user.role comes as an array from Spatie getRoleNames() e.g. ["admin"]
            const role = Array.isArray(user.role) ? user.role[0] : user.role

            localStorage.setItem("token", token)
            localStorage.setItem("role", role)
            if (user.school_type) {
                localStorage.setItem("school_type", user.school_type)
            }
            document.cookie = `token=${token}; path=/;`

            toast.success("Login berhasil!", {
                description: "Mengalihkan ke Dashboard..."
            })

            router.replace("/dashboard")

        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } }; message?: string };
            if (error.response?.data?.message) {
                console.error("Login gagal:", error.response.data.message)
                toast.error("Login Gagal", {
                    description: error.response.data.message
                })
            } else {
                const errorMsg = error.message || "Terjadi kesalahan tidak terduga";
                console.error(errorMsg)
                toast.error("Terjadi Kesalahan", {
                    description: errorMsg
                })
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-muted/30 p-4 md:p-8 font-sans">
            <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">

                {/* Left Side Copy */}
                <div className="hidden lg:block space-y-8 animate-in slide-in-from-left-8 duration-700">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <Shield className="w-8 h-8 text-primary" />
                            </div>
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-primary to-primary/80">
                                Mosikola
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                            Akses Ruang <span className="text-primary">Kontrol Mu</span>
                        </h1>

                        <p className="text-xl text-muted-foreground leading-relaxed max-w-md">
                            Masuk ke dashboard manajemen sekolah untuk memantau data absensi, aktivitas siswa, dan kinerja guru secara real-time.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {[
                            "Pemantauan seluruh aktivitas sekolah",
                            "Data riwayat kehadiran aman",
                            "Kelola pengguna dan paket langganan",
                            "Dukungan teknis prioritas"
                        ].map((benefit, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
                                    <Check className="w-5 h-5 text-green-600 dark:text-green-400" strokeWidth={3} />
                                </div>
                                <span className="text-foreground/80 font-medium text-lg">{benefit}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-8 border-t border-border/50">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                                        <User size={16} />
                                    </div>
                                ))}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Bergabung dengan <span className="font-bold text-foreground">500+ Sekolah</span> lainnya
                            </div>
                        </div>
                    </div>
                </div>

                {/* LoginForm Container */}
                <div className="w-full">
                    <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
                </div>
            </div>
        </div>
    )
}