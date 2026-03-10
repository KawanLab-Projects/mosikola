"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

type LoginFormProps = {
    onSubmit: (data: { user: string, password: string }) => void,
    isLoading?: boolean,
}

export function LoginForm({
    onSubmit,
    isLoading = false,
}: LoginFormProps) {
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        const data = {
            user: formData.get("user") as string,
            password: formData.get("password") as string,
        }
        onSubmit(data)
    }

    return (
        <Card className="border-border/50 shadow-xl shadow-primary/5">
            <CardContent className="p-6 md:p-8 lg:p-10">
                <div className="mb-8 text-center lg:text-left">
                    <Link href="/" className="lg:hidden inline-flex items-center gap-2 mb-6">
                        <div className="bg-primary/10 p-1.5 rounded-lg">
                            <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-lg font-bold text-foreground">Mosikola</span>
                    </Link>
                    <h2 className="text-2xl font-bold">Masuk ke Akun Anda</h2>
                    <p className="text-muted-foreground mt-1">Masukkan kredensial Anda untuk mengakses dashboard.</p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="user">Email atau Username</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="user"
                                    name="user"
                                    type="text"
                                    placeholder="admin@sekolah.sch.id"
                                    className="pl-9"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link
                                    href="#"
                                    className="text-xs font-semibold text-primary hover:underline"
                                >
                                    Lupa Password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="pl-9 pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        size="lg"
                        disabled={isLoading}
                        className="w-full font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all mt-4"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Memverifikasi...
                            </>
                        ) : "Masuk"}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground mt-4">
                        Belum punya akun?{" "}
                        <Link href="/auth/register" className="font-semibold text-primary hover:underline">
                            Daftar di sini
                        </Link>
                    </p>
                </form>

                <div className="mt-6 pt-6 border-t border-border/50 text-center">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Shield className="w-3 h-3" />
                        Akses diamankan dengan enkripsi standar industri.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
