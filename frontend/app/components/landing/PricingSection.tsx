"use client"

import { useEffect, useState } from "react"
import { Check, Loader2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

type Plan = {
    id: number
    name: string
    code: string
    price: string
    early_bird_price: string | null
    early_bird_limit: number | null
    student_limit: number
    teacher_limit: number
    features: Record<string, boolean> | null
}

const FEATURE_LABELS: Record<string, string> = {
    // Default features
    algorithmic_schedule_generator: "Generator Jadwal Algoritmik",
    absensi_reguler: "Absensi Harian",
    jurnal_mapel: "Jurnal Mapel",
    absensi_mapel: "Absensi Mapel",
    piket: "Piket",
    bimbingan_konseling: "Bimbingan Konseling",
    // Premium features
    import_schedule: "Import Jadwal XML",
    ai_counseling: "AI Helper Bimbingan Konseling",
    basic_ews: "Basic EWS",
    ai_analytics: "AI & EWS Analitik Full",
    basic_dashboard: "Dashboard Kepala Sekolah",
    standard_support: "Support Teknis Standar",
}

function formatRp(value: string | number): string {
    const n = parseFloat(String(value))
    if (n === 0) return "Gratis"
    if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}jt`
    if (n >= 1_000) return `Rp ${Math.round(n / 1_000)}k`
    return `Rp ${n.toLocaleString("id-ID")}`
}

function getCapacityLabel(plan: Plan): string {
    const teacher = plan.teacher_limit === 0 ? "Unlimited Guru" : `Maks ${plan.teacher_limit} Guru`
    const student = plan.student_limit === 0 ? "Unlimited Siswa" : `Maks ${plan.student_limit} Siswa`
    return `${teacher}, ${student}`
}

const DEFAULT_FEATURE_KEYS = [
    "algorithmic_schedule_generator",
    "absensi_reguler",
    "jurnal_mapel",
    "absensi_mapel",
    "piket",
    "bimbingan_konseling",
]

const PREMIUM_FEATURE_KEYS = [
    "import_schedule",
    "ai_counseling",
    "basic_ews",
    "ai_analytics",
]

function getDefaultFeatureLabels(): string[] {
    return DEFAULT_FEATURE_KEYS.map(k => FEATURE_LABELS[k])
}

function getEnabledPremiumFeatures(features: Record<string, boolean> | null): string[] {
    if (!features) return []
    return PREMIUM_FEATURE_KEYS
        .filter(k => features[k] === true)
        .map(k => FEATURE_LABELS[k])
}

function isPopular(plan: Plan): boolean {
    return plan.code === "favorit"
}

export function PricingSection() {
    const [plans, setPlans] = useState<Plan[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetch(`${API_URL}/plans`)
            .then(r => r.json())
            .then(data => setPlans(data.data || []))
            .catch(() => setPlans([]))
            .finally(() => setIsLoading(false))
    }, [])

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!plans.length) {
        return (
            <div className="text-center py-16 text-muted-foreground text-sm">
                Gagal memuat paket harga. Silakan refresh halaman.
            </div>
        )
    }

    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {plans.map((plan) => {
                const popular = isPopular(plan)
                const hasEarlyBird = !!plan.early_bird_price && parseFloat(plan.early_bird_price) > 0
                const isFree = parseFloat(plan.price) === 0
                const premiumFeatures = getEnabledPremiumFeatures(plan.features)

                return (
                    <div
                        key={plan.id}
                        className={cn(
                            "relative flex flex-col rounded-2xl border p-8 shadow-sm transition-shadow hover:shadow-md",
                            popular
                                ? "border-primary bg-primary/3 shadow-primary/10"
                                : "border-border bg-card"
                        )}
                    >
                        {popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow">
                                    <Star className="h-3 w-3 fill-current" /> Paling Populer
                                </span>
                            </div>
                        )}

                        {/* Name + Price */}
                        <div className="mb-6">
                            <h3 className={cn("text-lg font-bold mb-3", popular ? "text-primary" : "text-foreground")}>
                                {plan.name}
                            </h3>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-extrabold">
                                    {isFree ? "Gratis" : formatRp(plan.price)}
                                </span>
                                {!isFree && (
                                    <span className="text-muted-foreground text-sm">/bln</span>
                                )}
                            </div>
                            {hasEarlyBird && (
                                <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-2 py-1 rounded-md">
                                    🔥 Pengguna Awal: {formatRp(plan.early_bird_price!)}
                                    {plan.early_bird_limit && ` (${plan.early_bird_limit} slot)`}
                                </div>
                            )}
                        </div>

                        {/* Features */}
                        <div className="flex-1 border-t border-border pt-5 space-y-3 text-sm">
                            <p className="font-semibold text-foreground">Kapasitas</p>
                            <div className="flex items-start gap-2 text-muted-foreground">
                                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <span>{getCapacityLabel(plan)}</span>
                            </div>

                            <p className="font-semibold text-foreground pt-3">Fitur</p>

                            {isFree ? (
                                // Free plan: list all default features
                                getDefaultFeatureLabels().map((label: string) => (
                                    <div key={label} className="flex items-start gap-2 text-muted-foreground">
                                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                        <span>{label}</span>
                                    </div>
                                ))
                            ) : (
                                // Paid plans: show "all free features" summary + premium extras
                                <>
                                    <div className="flex items-start gap-2 text-muted-foreground">
                                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                        <span className="italic">Semua fitur di Free plan</span>
                                    </div>
                                    {premiumFeatures.map((label: string) => (
                                        <div key={label} className="flex items-start gap-2 text-muted-foreground">
                                            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            <span>{label}</span>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>

                        {/* CTA */}
                        <div className="mt-auto pt-8">
                            {isFree ? (
                                <Link href="/auth/register" className="block w-full">
                                    <Button
                                        className="w-full h-11 rounded-xl"
                                        variant={popular ? "default" : "outline"}
                                    >
                                        Mulai Gratis
                                    </Button>
                                </Link>
                            ) : (
                                <div className="w-full bg-muted/50 border border-border text-muted-foreground p-3 rounded-xl text-center text-xs font-medium leading-relaxed">
                                    Silakan daftar dan coba paket Gratis terlebih dahulu untuk upgrade ke paket ini.
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
