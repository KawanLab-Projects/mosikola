"use client"

import React, { useState, useEffect, useCallback } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { api } from "@/lib/api"
import { toast } from "sonner"
import axios from "axios"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bot, Save, PlugZap } from "lucide-react"

const aiSettingsSchema = z.object({
    ai_provider: z.enum(["gemini", "openai"], {
        message: "Silakan pilih AI Provider.",
    }),
    ai_model: z.string().min(1, {
        message: "Model AI wajib diisi.",
    }),
    ai_api_key: z.string().min(1, {
        message: "API Key wajib diisi.",
    }),
})

interface OpenAIModel {
    id: string
}

interface GeminiModel {
    name: string
    displayName?: string
}

export default function AiSettingsPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [isLoadingModels, setIsLoadingModels] = useState(false)
    const [availableModels, setAvailableModels] = useState<{ id: string, name: string }[]>([])

    const form = useForm<z.infer<typeof aiSettingsSchema>>({
        resolver: zodResolver(aiSettingsSchema),
        defaultValues: {
            ai_provider: "gemini",
            ai_model: "gemini-2.5-flash",
            ai_api_key: "",
        },
    })

    const apiKey = form.watch("ai_api_key")


    useEffect(() => {
        if (!apiKey || apiKey.length < 20) {
            setAvailableModels([])
            return
        }

        const fetchModels = async () => {
            setIsLoadingModels(true)
            try {
                if (apiKey.startsWith("sk-")) {
                    form.setValue("ai_provider", "openai")
                    const res = await axios.get("https://api.openai.com/v1/models", {
                        headers: { Authorization: `Bearer ${apiKey}` }
                    })
                    const models = res.data.data
                        .filter((m: OpenAIModel) => m.id.includes("gpt") || m.id.includes("o1") || m.id.includes("o3"))
                        .map((m: OpenAIModel) => ({ id: m.id, name: m.id }))
                        .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name))
                    setAvailableModels(models)

                    const currentModel = form.getValues("ai_model")
                    if (!currentModel || !models.find((m: { id: string }) => m.id === currentModel)) {
                        form.setValue("ai_model", models.length > 0 ? models[0].id : "")
                    }
                } else if (apiKey.startsWith("AIza")) {
                    form.setValue("ai_provider", "gemini")
                    const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
                    const models = res.data.models
                        .filter((m: GeminiModel) => m.name.includes("models/gemini"))
                        .map((m: GeminiModel) => ({
                            id: m.name.replace('models/', ''),
                            name: m.displayName || m.name.replace('models/', '')
                        }))
                    setAvailableModels(models)

                    const currentModel = form.getValues("ai_model")
                    if (!currentModel || !models.find((m: { id: string }) => m.id === currentModel)) {
                        form.setValue("ai_model", models.length > 0 ? models[0].id : "")
                    }
                } else {
                    setAvailableModels([])
                }
            } catch (error) {
                console.error("Fetch models error", error)
                setAvailableModels([])
                toast.error("Gagal memuat otomatis, silakan ketik nama model teks secara manual.")
            } finally {
                setIsLoadingModels(false)
            }
        }

        const timer = setTimeout(() => {
            fetchModels()
        }, 800)

        return () => clearTimeout(timer)
    }, [apiKey, form])

    const fetchSettings = useCallback(async () => {
        try {
            const res = await api.get("/superadmin/ai-settings")
            const data = res.data.data

            form.reset({
                ai_provider: data.ai_provider || "gemini",
                ai_model: data.ai_model || "gemini-2.5-flash",
                ai_api_key: data.ai_api_key || "",
            })
        } catch (error) {
            console.error(error)
            toast.error("Gagal memuat pengaturan AI saat ini.")
        } finally {
            setIsFetching(false)
        }
    }, [form])

    useEffect(() => {
        fetchSettings()
    }, [fetchSettings])

    const onSubmit = async (values: z.infer<typeof aiSettingsSchema>) => {
        setIsLoading(true)
        try {
            const res = await api.put("/superadmin/ai-settings", values)
            toast.success(res.data.message || "Pengaturan AI berhasil disimpan")
        } catch (error) {
            console.error(error)
            toast.error("Gagal menyimpan pengaturan AI")
        } finally {
            setIsLoading(false)
        }
    }

    const testConnection = async () => {
        // Validate form first before testing
        const isValid = await form.trigger()
        if (!isValid) return

        setIsTesting(true)
        const values = form.getValues()

        try {
            const res = await api.post("/superadmin/ai-settings/test-connection", values)
            toast.success(res.data.message || "Koneksi ke AI Provider berhasil!")
        } catch (error: unknown) {
            console.error(error)
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Gagal terhubung ke AI Provider.")
            } else {
                toast.error("Terjadi kesalahan sistem saat menguji koneksi.")
            }
        } finally {
            setIsTesting(false)
        }
    }

    if (isFetching) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-6 p-8">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Pengaturan Artificial Intelligence</h2>
                    <p className="text-muted-foreground">
                        Konfigurasi global Provider LLM untuk fitur cerdas di Mosikola (contoh: Rekomendasi BK).
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_300px]">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" /> Konfigurasi Provider AI</CardTitle>
                        <CardDescription>
                            Tentukan layanan mana yang akan digunakan sistem untuk merelasikan prompt kecerdasan buatan.
                        </CardDescription>
                    </CardHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="ai_api_key"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>API Key</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Mulai dengan sk-... atau AIza..." {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Paste API Key Anda di sini. Daftar model akan dimuat secara otomatis.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="ai_provider"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Provider AI</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih Provider" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="gemini">Google Gemini</SelectItem>
                                                    <SelectItem value="openai">OpenAI (ChatGPT)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                Penyedia layanan model AI secara otomatis dideteksi dari kunci API.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="ai_model"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nama Model</FormLabel>
                                            <FormControl>
                                                {isLoadingModels ? (
                                                    <div className="flex items-center gap-2 h-10 px-3 py-2 border rounded-md text-sm text-muted-foreground bg-muted/50">
                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                                        Memuat daftar model...
                                                    </div>
                                                ) : availableModels.length > 0 ? (
                                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Pilih Model AI" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {availableModels.map((m) => (
                                                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Input placeholder="contoh: gemini-2.5-flash atau gpt-4o-mini" {...field} />
                                                )}
                                            </FormControl>
                                            <FormDescription>
                                                Pilih model yang tersedia atau ketik secara manual.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                            <CardFooter className="flex justify-between border-t px-6 py-4">
                                <Button type="button" variant="outline" onClick={testConnection} disabled={isTesting || isLoading} className="gap-2">
                                    {isTesting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <PlugZap className="h-4 w-4" />}
                                    Uji Koneksi
                                </Button>
                                <Button type="submit" disabled={isLoading} className="gap-2">
                                    {isLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <Save className="h-4 w-4" />}
                                    Simpan Pengaturan
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Informasi</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground space-y-4">
                            <p>
                                Pengaturan ini bersifat <strong>Global</strong>. Ini berarti seluruh tenant sekolah yang berlangganan paket dengan fitur AI akan menggunakan API Server yang Anda tetapkan di sini.
                            </p>
                            <p>
                                Pastikan saldo / kuota pada Provider AI Anda mencukupi, karena permintaan akan gagal jika limit API tercapai.
                            </p>
                            <p>
                                <strong>Peringatan!</strong> Jangan pernah membagikan halaman pengaturan ini kepada sembarang staf admin, mengingat token Anda berstatus aktif.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
