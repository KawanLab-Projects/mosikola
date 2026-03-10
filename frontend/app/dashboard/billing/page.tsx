"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Loader2, AlertCircle } from "lucide-react"
import { UsageTracker } from "@/app/components/billing/UsageTracker"
import { PricingGrid } from "@/app/components/billing/PricingGrid"

interface Plan {
    id: number;
    name: string;
    code: string;
    price: string;
    early_bird_price: string | null;
    early_bird_limit: number | null;
    student_limit: number;
    teacher_limit: number;
    features: Record<string, boolean>;
}

interface Usage {
    students: number;
    teachers: number;
}

export default function BillingPage() {
    const [plans, setPlans] = useState<Plan[]>([])
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
    const [usage, setUsage] = useState<Usage | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchBillingData = async () => {
            try {
                // Fetch user tracking data and plan limits concurrently with all available plans
                const [meRes, plansRes] = await Promise.all([
                    api.get("/auth/me"),
                    fetch(process.env.NEXT_PUBLIC_API_URL + "/plans").then(res => res.json())
                ])

                const userData = meRes.data
                if (userData.plan) setCurrentPlan(userData.plan)
                if (userData.usage) setUsage(userData.usage)

                setPlans(plansRes.data || [])
            } catch (err: unknown) {
                console.error("Failed to load billing data", err)
                setError("Gagal memuat data tagihan. Silakan coba lagi nanti.")
            } finally {
                setIsLoading(false)
            }
        }

        fetchBillingData()
    }, [])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-destructive/10 text-destructive p-4 rounded-xl flex items-center gap-3 w-fit">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-12">

            {/* Header section */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Tagihan & Langganan</h1>
                <p className="text-muted-foreground w-full max-w-2xl">
                    Kelola paket langganan dan periksa penggunaan kuota siswa serta guru di sekolah Anda.
                </p>
            </div>

            {/* Current Usage Tracker */}
            {currentPlan && usage && (
                <section className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold">Paket Saat Ini: <span className="text-primary">{currentPlan.name}</span></h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Berikut adalah status penggunaan kapasitas Anda dibandingkan dengan batas paket.
                        </p>
                    </div>
                    <UsageTracker plan={currentPlan} usage={usage} />
                </section>
            )}

            {/* Pricing / Upgrade Flow */}
            <section className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Tingkatkan Paket Anda</h2>
                    <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
                        Dapatkan lebih banyak kuota guru, siswa, serta akses ke fitur premium seperti Generator Jadwal AI dan Integrasi penuh EWS untuk meningkatkan kualitas manajemen sekolah.
                    </p>
                </div>

                <PricingGrid plans={plans} currentPlanId={currentPlan?.id ?? null} />
            </section>

        </div>
    )
}