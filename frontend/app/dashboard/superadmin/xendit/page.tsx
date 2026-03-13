"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import axios from "axios"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { CreditCard, Save, Loader2, Eye, EyeOff, CheckCircle2, XCircle, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const xenditSchema = z.object({
    xendit_secret_key: z.string().optional(),
    xendit_webhook_token: z.string().optional(),
    xendit_frontend_url: z.string().url("URL harus valid (https://...)").or(z.literal("")).optional(),
})

type XenditFormValues = z.infer<typeof xenditSchema>

export default function XenditSettingPage() {
    const [isLoading, setIsLoading] = React.useState(true)
    const [isSaving, setIsSaving] = React.useState(false)
    const [isTesting, setIsTesting] = React.useState(false)
    const [isConfigured, setIsConfigured] = React.useState(false)
    const [showSecretKey, setShowSecretKey] = React.useState(false)

    const form = useForm<XenditFormValues>({
        resolver: zodResolver(xenditSchema),
        defaultValues: {
            xendit_secret_key: "",
            xendit_webhook_token: "",
            xendit_frontend_url: "",
        },
    })

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get("/superadmin/xendit")
                const data = res.data.data
                if (data) {
                    form.reset({
                        xendit_secret_key: data.xendit_secret_key || "",
                        xendit_webhook_token: data.xendit_webhook_token || "",
                        xendit_frontend_url: data.xendit_frontend_url || "",
                    })
                    setIsConfigured(data.is_configured ?? false)
                }
            } catch (error: unknown) {
                if (axios.isAxiosError(error)) {
                    toast.error(error.response?.data?.message || "Gagal mengambil pengaturan Xendit")
                } else {
                    toast.error("Gagal mengambil pengaturan Xendit")
                }
            } finally {
                setIsLoading(false)
            }
        }
        fetchSettings()
    }, [form])

    const onSubmit = async (values: XenditFormValues) => {
        setIsSaving(true)
        try {
            const res = await api.put("/superadmin/xendit", values)
            toast.success(res.data.message || "Pengaturan berhasil disimpan")
            setIsConfigured(true)
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Terjadi kesalahan saat menyimpan")
            } else {
                toast.error("Terjadi kesalahan saat menyimpan")
            }
        } finally {
            setIsSaving(false)
        }
    }

    const testConnection = async () => {
        setIsTesting(true)
        try {
            const res = await api.post("/superadmin/xendit/test-connection")
            toast.success(res.data.message || "Koneksi Xendit berhasil!")
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Gagal terhubung ke Xendit")
            } else {
                toast.error("Gagal terhubung ke Xendit")
            }
        } finally {
            setIsTesting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-4xl py-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <CreditCard className="h-6 w-6 text-primary" />
                        Xendit Payment Gateway
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Konfigurasi kredensial Xendit untuk memproses pembayaran kartu siswa dan upgrade paket.
                    </p>
                </div>
                <Badge
                    variant={isConfigured ? "default" : "secondary"}
                    className="flex items-center gap-1.5 text-sm px-3 py-1"
                >
                    {isConfigured ? (
                        <><CheckCircle2 className="h-3.5 w-3.5" /> Terkonfigurasi</>
                    ) : (
                        <><XCircle className="h-3.5 w-3.5" /> Belum Dikonfigurasi</>
                    )}
                </Badge>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                    {/* API Credentials */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Kredensial API</CardTitle>
                            <CardDescription>
                                Dapatkan Secret Key dari{" "}
                                <a
                                    href="https://dashboard.xendit.co/settings/developers#api-keys"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline text-primary hover:text-primary/80"
                                >
                                    Xendit Dashboard → Settings → API Keys
                                </a>
                                . Gunakan <strong>Production Key</strong> untuk live, atau <strong>Money-In Money-Out</strong> secret key.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="xendit_secret_key"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Secret Key</FormLabel>
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type={showSecretKey ? "text" : "password"}
                                                    placeholder="xnd_production_..."
                                                    autoComplete="new-password"
                                                />
                                            </FormControl>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setShowSecretKey(v => !v)}
                                                title={showSecretKey ? "Sembunyikan" : "Tampilkan"}
                                            >
                                                {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        <FormDescription>
                                            Nilai yang ditampilkan sudah disamarkan. Kosongkan field ini jika tidak ingin mengubah secret key yang ada.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="h-px bg-border" />

                            <FormField
                                control={form.control}
                                name="xendit_webhook_token"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Webhook Verification Token</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Token dari Xendit Dashboard → Settings → Webhooks"
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Digunakan untuk memverifikasi bahwa webhook berasal dari Xendit.
                                            Daftarkan URL webhook:{" "}
                                            <code className="bg-muted rounded px-1 text-xs">
                                                https://api.mosikola.com/api/webhook/xendit
                                            </code>
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Redirect URLs */}
                    <Card>
                        <CardHeader>
                            <CardTitle>URL Redirect Pembayaran</CardTitle>
                            <CardDescription>
                                Xendit akan mengarahkan pengguna ke URL ini setelah proses pembayaran selesai.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="xendit_frontend_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Frontend Base URL</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="url"
                                                placeholder="https://app.mosikola.com"
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            URL dasar aplikasi frontend. Setelah sukses, pengguna akan diarahkan ke{" "}
                                            <code className="bg-muted rounded px-1 text-xs">[base-url]/dashboard/billing?status=success</code>.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={testConnection}
                            disabled={isTesting || !isConfigured}
                            id="xendit-test-connection-btn"
                        >
                            {isTesting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menguji Koneksi...</>
                            ) : (
                                <><Zap className="mr-2 h-4 w-4" /> Test Koneksi</>
                            )}
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            id="xendit-save-btn"
                        >
                            {isSaving ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                            ) : (
                                <><Save className="mr-2 h-4 w-4" /> Simpan Pengaturan</>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
