"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BadgeCheck, CreditCard, ArrowRight, Wallet } from "lucide-react"

type Plan = {
    id: number
    name: string
    code: string
    price: string
    early_bird_price: string | null
}

interface CheckoutModalProps {
    isOpen: boolean
    onClose: () => void
    plan: Plan | null
    currentPlanId: number | null
}

function formatRp(value: string | number): string {
    const n = parseFloat(String(value))
    if (n === 0) return "Gratis"
    return `Rp ${n.toLocaleString("id-ID")}`
}

export function CheckoutModal({ isOpen, onClose, plan }: CheckoutModalProps) {
    if (!plan) return null

    const isFree = parseFloat(plan.price) === 0
    const hasEarlyBird = !!plan.early_bird_price && parseFloat(plan.early_bird_price) > 0

    const finalPrice = hasEarlyBird ? plan.early_bird_price! : plan.price

    const handleCheckout = () => {
        // In the future, this will initiate the Midtrans Snap payment
        console.log("Initiating checkout for plan:", plan.name)
        alert("Integrasi pembayaran akan datang segera! Anda memilih: " + plan.name)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isFree ? <BadgeCheck className="w-5 h-5 text-green-500" /> : <CreditCard className="w-5 h-5 text-primary" />}
                        Konfirmasi Pilihan Paket
                    </DialogTitle>
                    <DialogDescription>
                        Anda akan beralih ke paket <strong>{plan.name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="bg-muted p-4 rounded-xl border border-border">
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Cek Kembali</h4>
                        <div className="flex justify-between items-end">
                            <span className="text-lg font-bold">{plan.name}</span>
                            <div className="text-right">
                                {hasEarlyBird && (
                                    <span className="block text-xs text-muted-foreground line-through decoration-red-500/50">
                                        {formatRp(plan.price)}
                                    </span>
                                )}
                                <span className="text-xl font-extrabold text-primary">
                                    {formatRp(finalPrice)}
                                    {!isFree && <span className="text-sm font-medium text-muted-foreground">/bln</span>}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="text-sm text-muted-foreground bg-primary/5 p-3 rounded-lg flex items-start gap-2">
                        <Wallet className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                        {isFree
                            ? "Anda akan dialihkan ke paket Gratis. Beberapa fitur eksklusif mungkin tidak dapat diakses lagi."
                            : "Siklus penagihan Anda akan dimulai hari ini. Pembayaran dapat dilakukan via Virtual Account, QRIS, atau Kartu Kredit."}
                    </div>
                </div>

                <DialogFooter className="sm:justify-between gap-3 flex-col sm:flex-row">
                    <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto">Batal</Button>
                    <Button
                        onClick={handleCheckout}
                        className="w-full sm:w-auto"
                        variant={isFree ? "default" : "default"} // Can style differently based on plan
                    >
                        {isFree ? "Lanjutkan ke Gratis" : "Proses Pembayaran"}
                        {!isFree && <ArrowRight className="w-4 h-4 ml-2" />}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
