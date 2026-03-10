import { TenantTable } from "./components/TenantTable"

export const metadata = {
    title: "Data Sekolah | Mosikola",
    description: "Manajemen sekolah terdaftar dan paket langganan",
}

export default function SekolahPage() {
    return (
        <div className="space-y-6 p-1">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Data Sekolah</h1>
                    <p className="text-muted-foreground">Manajemen seluruh sekolah yang terdaftar di sistem. Pantau paket aktif dan jumlah pengguna.</p>
                </div>
            </div>

            <TenantTable />
        </div>
    )
}
