"use client"

import { useEffect, useState, useCallback } from "react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Plus,
    Edit,
    Trash2,
    Image as ImageIcon,
    LayoutTemplate
} from "lucide-react"
import Link from "next/link"

interface Template {
    id: number;
    public_id: string;
    name: string;
    background_path: string | null;
    back_background_path: string | null;
    thumbnail_path: string | null;
    price: number;
    is_active: boolean;
}

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)

    const fetchTemplates = useCallback(async () => {
        try {
            setLoading(true)
            const res = await api.get('/superadmin/id-card-templates')
            setTemplates(res.data)
        } catch {
            toast.error("Gagal memuat template")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchTemplates()
    }, [fetchTemplates])

    const handleCreateTemplate = async () => {
        try {
            const formData = new FormData()
            formData.append('name', 'Template Baru')
            formData.append('price', '10000')

            const res = await api.post('/superadmin/id-card-templates', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            toast.success("Template berhasil dibuat")
            setTemplates([...templates, res.data])
        } catch {
            toast.error("Gagal membuat template")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus template ini?")) return;

        try {
            await api.delete(`/superadmin/id-card-templates/${id}`)
            toast.success("Template dihapus")
            setTemplates(templates.filter(t => t.public_id !== id))
        } catch {
            toast.error("Gagal menghapus template")
        }
    }

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Template Kartu Siswa</h1>
                    <p className="text-muted-foreground">Kelola desain dan harga cetak kartu siswa</p>
                </div>
                <Button onClick={handleCreateTemplate} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Template Baru
                </Button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse">
                            <div className="h-48 bg-muted rounded-t-xl" />
                            <CardContent className="p-4">
                                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                                <div className="h-4 bg-muted rounded w-1/4" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : templates.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
                    <LayoutTemplate className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                    <h3 className="text-lg font-medium text-foreground">Belum ada template</h3>
                    <p className="text-muted-foreground mt-1 max-w-md mx-auto">
                        Klik tombol di atas untuk membuat desain template kartu siswa pertama Anda.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(template => (
                        <Card key={template.id} className="overflow-hidden hover:shadow-md transition-shadow group border-border">
                            <div className="relative h-56 bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center border-b group-hover:bg-primary/5 transition-colors">
                                {template.thumbnail_path || template.background_path ? (
                                    <div
                                        className="absolute inset-0 bg-cover bg-center"
                                        style={{ backgroundImage: `url(${process.env.NEXT_PUBLIC_ASSET_URL}/storage/${template.thumbnail_path || template.background_path})` }}
                                    />
                                ) : (
                                    <div className="text-muted-foreground flex flex-col items-center">
                                        <ImageIcon className="h-10 w-10 opacity-50 mb-2" />
                                        <span className="text-sm font-medium">Belum ada background</span>
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Link href={`/dashboard/superadmin/kartu-siswa/templates/${template.public_id}/editor`}>
                                        <Button variant="secondary" size="sm">
                                            <Edit className="h-4 w-4 mr-2" />
                                            Desain
                                        </Button>
                                    </Link>
                                </div>

                                {!template.is_active && (
                                    <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                                        Draft
                                    </div>
                                )}
                            </div>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight truncate">{template.name}</h3>
                                        <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm mt-1">
                                            Rp {template.price.toLocaleString('id-ID')} / pcs
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 -mt-1 -mr-2" onClick={() => handleDelete(template.public_id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
