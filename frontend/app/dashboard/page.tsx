"use client"

import { useEffect, useState } from "react"
import AdminDashboard from "../components/AdminDashboard"
import SuperAdminDashboard from "../components/SuperAdminDashboard"
import TeacherDashboard from "../components/TeacherDashboard"


export default function DashboardPage() {
    const [role, setRole] = useState<string | null>(null)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true)
        const storedRole = localStorage.getItem("role")
        if (storedRole) {
            setRole(storedRole)
        }
    }, [])

    if (!isMounted) return null

    if (role === 'superadmin') return <SuperAdminDashboard />
    if (role === 'admin') return <AdminDashboard />
    return <TeacherDashboard />
}