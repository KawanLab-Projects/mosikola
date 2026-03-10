"use client"

import { usePathname } from "next/navigation"
import MainLayout from "./MainLayout";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathName = usePathname();

    const useMainLayoutPath = [
        "/dashboard",
    ]

    const noLayoutPath = [
        "/auth/login",
        "/auth/register",
        "/qrattendance",
    ]

    if (noLayoutPath.includes(pathName)) {
        return <>
            {children}
        </>
    }

    const useMainLayout = useMainLayoutPath.some(p => pathName.startsWith(p));
    if (useMainLayout) {
        return <MainLayout>{children}</MainLayout>
    }

    return <>{children}</>
}