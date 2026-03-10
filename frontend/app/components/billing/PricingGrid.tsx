"use client"

import { useState } from "react"
import { Check, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CheckoutModal } from "./CheckoutModal"

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

interface PricingGridProps {
    plans: Plan[]
    currentPlanId: number | null
}

const FEATURE_LABELS: Record<string, string> = {
    algorithmic_schedule_generator: "Generator Jadwal Algoritmik",
    absensi_reguler: "Absensi Harian",
    jurnal_mapel: "Jurnal Mapel",
    absensi_mapel: "Absensi Mapel",
    piket: "Piket",
    bimbingan_konseling: "Bimbingan Konseling",
    import_schedule: "Import Jadwal XML",
    ai_counseling: "AI Helper Bimbingan Konseling",
    ai_analytics: "AI & EWS Analitik Full",
    basic_dashboard: "Dashboard Kepala Sekolah",
    standard_support: "Support Teknis Standar",
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
    "ai_analytics",
]

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

export function PricingGrid({ plans, currentPlanId }: PricingGridProps) {
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)

    return (
        <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans.map((plan) => {
                    const popular = plan.code === "perintis"
                    const isCurrentPlan = currentPlanId === plan.id
                    const hasEarlyBird = !!plan.early_bird_price && parseFloat(plan.early_bird_price) > 0
                    const isFree = parseFloat(plan.price) === 0

                    const premiumFeatures = PREMIUM_FEATURE_KEYS
                        .filter(k => plan.features?.[k] === true)
                        .map(k => FEATURE_LABELS[k])

                    return (
                        <div
                            key={plan.id}
                            className={cn(
                                "relative flex flex-col rounded-2xl border p-6 shadow-sm transition-all",
                                popular && !isCurrentPlan ? "border-primary bg-primary/5 shadow-primary/10" : "border-border bg-card",
                                isCurrentPlan ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                            )}
                        >
                            {isCurrentPlan && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                                    <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow">
                                        Paket Saat Ini
                                    </span>
                                </div>
                            )}

                            {popular && !isCurrentPlan && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="inline-flex items-center gap-1 bg-primary/90 text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow">
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
                                        🔥 Promo: {formatRp(plan.early_bird_price!)}
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
                                    DEFAULT_FEATURE_KEYS.map((key) => (
                                        <div key={key} className="flex items-start gap-2 text-muted-foreground">
                                            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            <span>{FEATURE_LABELS[key]}</span>
                                        </div>
                                    ))
                                ) : (
                                    <>
                                        <div className="flex items-start gap-2 text-muted-foreground">
                                            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            <span className="italic">Semua fitur di Gratis</span>
                                        </div>
                                        {premiumFeatures.map((label: string) => (
                                            <div key={label} className="flex items-start gap-2 text-muted-foreground">
                                                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                                <span className="font-medium text-foreground">{label}</span>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>

                            {/* CTA */}
                            <div className="mt-6 pt-6 border-t border-border/50">
                                {isCurrentPlan ? (
                                    <Button disabled className="w-full bg-muted text-muted-foreground" variant="outline">
                                        Paket Aktif
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full"
                                        variant={popular ? "default" : "outline"}
                                        onClick={() => setSelectedPlan(plan)}
                                    >
                                        Pilih {plan.name}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <CheckoutModal
                isOpen={!!selectedPlan}
                onClose={() => setSelectedPlan(null)}
                plan={selectedPlan}
                currentPlanId={currentPlanId}
            />
        </>
    )
}
