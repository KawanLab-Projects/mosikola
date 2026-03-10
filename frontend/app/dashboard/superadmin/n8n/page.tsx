"use client"

import * as React from "react"
import { useForm, ControllerRenderProps } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import axios from "axios"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { Bot, Save, TestTube2, Loader2 } from "lucide-react"

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

const urlFieldSchema = z.string().url("URL harus valid").or(z.literal(""))

const webhookSchema = z.object({
    n8n_webhook_teacher_reminder: urlFieldSchema,
    n8n_webhook_student_late_homeroom: urlFieldSchema,
    n8n_webhook_student_late_parent: urlFieldSchema,
    n8n_webhook_student_growth: urlFieldSchema,
})

type WebhookFormValues = z.infer<typeof webhookSchema>

export default function N8nPage() {
    const [isLoading, setIsLoading] = React.useState(true)
    const [isSaving, setIsSaving] = React.useState(false)
    const [testingKey, setTestingKey] = React.useState<string | null>(null)

    const form = useForm<WebhookFormValues>({
        resolver: zodResolver(webhookSchema),
        defaultValues: {
            n8n_webhook_teacher_reminder: "",
            n8n_webhook_student_late_homeroom: "",
            n8n_webhook_student_late_parent: "",
            n8n_webhook_student_growth: "",
        },
    })

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get("/superadmin/n8n")
                const data = res.data.data
                if (data) {
                    form.reset({
                        n8n_webhook_teacher_reminder: data.n8n_webhook_teacher_reminder || "",
                        n8n_webhook_student_late_homeroom: data.n8n_webhook_student_late_homeroom || "",
                        n8n_webhook_student_late_parent: data.n8n_webhook_student_late_parent || "",
                        n8n_webhook_student_growth: data.n8n_webhook_student_growth || "",
                    })
                }
            } catch (error: unknown) {
                if (axios.isAxiosError(error)) {
                    toast.error(error.response?.data?.message || "Gagal mengambil pengaturan n8n")
                } else {
                    toast.error("Gagal mengambil pengaturan n8n")
                }
                console.error(error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchSettings()
    }, [form])

    const onSubmit = async (values: WebhookFormValues) => {
        setIsSaving(true)
        try {
            const res = await api.put("/superadmin/n8n", values)
            toast.success(res.data.message || "Pengaturan berhasil disimpan")
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Terjadi kesalahan saat menyimpan pengaturan")
            } else {
                toast.error("Terjadi kesalahan saat menyimpan pengaturan")
            }
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const testWebhook = async (key: keyof WebhookFormValues) => {
        const url = form.getValues(key)

        if (!url) {
            toast.warning("URL Webhook belum diisi")
            return
        }

        const { success } = urlFieldSchema.safeParse(url)
        if (!success) {
            toast.error("URL tidak valid")
            return
        }

        setTestingKey(key)
        try {
            const res = await api.post("/superadmin/n8n/test", { url })
            toast.success(res.data.message || "Webhook berhasil dites")
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Gagal mengetes webhook")
            } else {
                toast.error("Gagal mengetes webhook")
            }
            console.error(error)
        } finally {
            setTestingKey(null)
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
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Bot className="h-6 w-6 text-primary" />
                    Automation Settings (n8n)
                </h1>
                <p className="text-muted-foreground mt-1">
                    Kendalikan integrasi webhook n8n global untuk mengotomatiskan fitur Mosikola.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Konfigurasi Webhook Automasi</CardTitle>
                    <CardDescription>
                        Masukkan Production URL dari workflow n8n Anda untuk setiap event di bawah ini.
                    </CardDescription>
                </CardHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="n8n_webhook_teacher_reminder"
                                render={({ field }: { field: ControllerRenderProps<WebhookFormValues, "n8n_webhook_teacher_reminder"> }) => (
                                    <FormItem>
                                        <FormLabel>Reminder Jadwal Guru (WhatsApp)</FormLabel>
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <Input placeholder="https://n8n.yourdomain.com/webhook/..." {...field} />
                                            </FormControl>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                disabled={testingKey === "n8n_webhook_teacher_reminder" || !field.value}
                                                onClick={() => testWebhook("n8n_webhook_teacher_reminder")}
                                            >
                                                {testingKey === "n8n_webhook_teacher_reminder" ? (
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                ) : (
                                                    <TestTube2 className="h-4 w-4 mr-2" />
                                                )}
                                                Test
                                            </Button>
                                        </div>
                                        <FormDescription>Webhook ini akan dipanggil untuk mengirimkan pesan pengingat jadwal mengajar harian ke WhatsApp guru.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="h-px bg-border my-4" />

                            <FormField
                                control={form.control}
                                name="n8n_webhook_student_late_homeroom"
                                render={({ field }: { field: ControllerRenderProps<WebhookFormValues, "n8n_webhook_student_late_homeroom"> }) => (
                                    <FormItem>
                                        <FormLabel>Notifikasi Siswa Terlambat (Wali Kelas)</FormLabel>
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <Input placeholder="https://n8n.yourdomain.com/webhook/..." {...field} />
                                            </FormControl>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                disabled={testingKey === "n8n_webhook_student_late_homeroom" || !field.value}
                                                onClick={() => testWebhook("n8n_webhook_student_late_homeroom")}
                                            >
                                                {testingKey === "n8n_webhook_student_late_homeroom" ? (
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                ) : (
                                                    <TestTube2 className="h-4 w-4 mr-2" />
                                                )}
                                                Test
                                            </Button>
                                        </div>
                                        <FormDescription>Webhook ini akan dipanggil untuk memberi laporan ke Wali Kelas jika ada siswanya yang masuk terlambat.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="h-px bg-border my-4" />

                            <FormField
                                control={form.control}
                                name="n8n_webhook_student_late_parent"
                                render={({ field }: { field: ControllerRenderProps<WebhookFormValues, "n8n_webhook_student_late_parent"> }) => (
                                    <FormItem>
                                        <FormLabel>Notifikasi Siswa Terlambat (Orang Tua)</FormLabel>
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <Input placeholder="https://n8n.yourdomain.com/webhook/..." {...field} />
                                            </FormControl>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                disabled={testingKey === "n8n_webhook_student_late_parent" || !field.value}
                                                onClick={() => testWebhook("n8n_webhook_student_late_parent")}
                                            >
                                                {testingKey === "n8n_webhook_student_late_parent" ? (
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                ) : (
                                                    <TestTube2 className="h-4 w-4 mr-2" />
                                                )}
                                                Test
                                            </Button>
                                        </div>
                                        <FormDescription>Webhook ini akan dipanggil untuk memberi notifikasi ke Orang Tua bahwa anaknya tiba di sekolah terlambat.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="h-px bg-border my-4" />

                            <FormField
                                control={form.control}
                                name="n8n_webhook_student_growth"
                                render={({ field }: { field: ControllerRenderProps<WebhookFormValues, "n8n_webhook_student_growth"> }) => (
                                    <FormItem>
                                        <FormLabel>Informasi Tumbuh Kembang Siswa (Orang Tua)</FormLabel>
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <Input placeholder="https://n8n.yourdomain.com/webhook/..." {...field} />
                                            </FormControl>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                disabled={testingKey === "n8n_webhook_student_growth" || !field.value}
                                                onClick={() => testWebhook("n8n_webhook_student_growth")}
                                            >
                                                {testingKey === "n8n_webhook_student_growth" ? (
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                ) : (
                                                    <TestTube2 className="h-4 w-4 mr-2" />
                                                )}
                                                Test
                                            </Button>
                                        </div>
                                        <FormDescription>Webhook ini akan dipanggil untuk memberikan insight perkembangan akademik dan perilaku siswa kepada orang tua.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardFooter className="flex justify-end border-t p-6">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Simpan Pengaturan
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    )
}