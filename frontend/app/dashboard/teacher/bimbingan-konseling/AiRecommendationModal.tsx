"use client"

import { useState, useEffect, useCallback } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { Bot, Sparkles, AlertCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import axios from "axios"

interface Student {
    id: number | string;
    public_id?: string;
    name: string;
}

interface AiRecommendationModalProps {
    isOpen: boolean
    onClose: () => void
    student: Student | null | undefined
}

export default function AiRecommendationModal({ isOpen, onClose, student }: AiRecommendationModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [recommendation, setRecommendation] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const fetchRecommendation = useCallback(async () => {
        if (!student) return

        setIsLoading(true)
        setError(null)
        setRecommendation(null)

        try {
            const res = await api.post("/bk/ai-recommendation", {
                student_id: student.public_id || student.id,
            })
            setRecommendation(res.data.data.recommendation)
        } catch (err: unknown) {
            console.error(err)
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Terjadi kesalahan saat meminta rekomendasi AI.")
                toast.error(err.response?.data?.message || "Gagal mendapatkan rekomendasi.")
            } else {
                setError("Terjadi kesalahan sistem internal.")
                toast.error("Gagal mendapatkan rekomendasi.")
            }
        } finally {
            setIsLoading(false)
        }
    }, [student])

    useEffect(() => {
        if (isOpen && student && !recommendation) {
            fetchRecommendation()
        }
        if (!isOpen) {
            // Reset state when closed
            const timer = setTimeout(() => {
                setRecommendation(null)
                setError(null)
            }, 300)
            return () => clearTimeout(timer)
        }
    }, [isOpen, student, recommendation, fetchRecommendation])

    // Markdown simple parser logic for bold text and list handling
    const renderMarkdownText = (text: string) => {
        if (!text) return null

        // Simple regex to bold texts wrapped in ** and handle newlines
        const parts = text.split(/(\*\*.*?\*\*)/g)

        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="text-slate-900 dark:text-white font-semibold">{part.slice(2, -2)}</strong>
            }
            return <span key={index}>{part}</span>
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
            <DialogContent className="sm:max-w-[650px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        AI Helper Bimbingan Konseling
                    </DialogTitle>
                    <DialogDescription>
                        Rekomendasi penanganan berbasis AI untuk siswa <strong>{student?.name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-[300px] py-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 py-12">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                                <Bot className="h-12 w-12 text-primary animate-pulse relative z-10" />
                                <Sparkles className="h-4 w-4 text-amber-400 absolute -top-1 -right-1 animate-ping" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    AI sedang menganalisis data riwayat siswa...
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Menyusun profil psikologis & saran tindak lanjut
                                </p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-3 text-red-500 py-8 text-center px-4">
                            <AlertCircle className="h-10 w-10" />
                            <p className="font-medium text-sm">{error}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchRecommendation}
                                className="mt-2 text-slate-700 dark:text-slate-300"
                            >
                                Coba Lagi
                            </Button>
                        </div>
                    ) : recommendation ? (
                        <ScrollArea className="h-full pr-4">
                            <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                {renderMarkdownText(recommendation)}
                            </div>
                        </ScrollArea>
                    ) : null}
                </div>

                <DialogFooter className="sm:justify-between border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground flex items-center pr-2">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Rekomendasi disajikan oleh AI, tinjau kembali sebelum diterapkan.
                    </p>
                    <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
