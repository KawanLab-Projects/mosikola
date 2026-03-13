"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  Home,
  School,
  SquareTerminal,
  User,
  Users,
  FileText,
  GraduationCap,
  IdCard,
  DollarSign
} from "lucide-react"

import { NavMain } from "./nav-main";

type NavSubItem = {
  title: string
  url: string
  requiresJurusan?: boolean
  isLocked?: boolean
}

type NavItem = {
  title: string
  url: string
  icon: React.ForwardRefExoticComponent<React.RefAttributes<SVGSVGElement>>
  isActive?: boolean
  roles?: string[]
  items?: NavSubItem[]
}
import { NavUser } from "./nav-user"
import { AppName } from "./app-name"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  appInfo: [
    {
      name: "Mosikola",
      logo: School,
      slogan: "Sahabat Tepat Sekolah Kamu",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Data Sekolah",
      url: "#",
      icon: User,
      isActive: true,
      roles: ["superadmin"],
      items: [
        {
          title: "Registrasi",
          url: "/dashboard/superadmin/registrasi",
        },
        {
          title: "Sekolah Terdaftar",
          url: "/dashboard/superadmin/sekolah",
        },
        {
          title: "Paket Layanan",
          url: "/dashboard/superadmin/paket",
        },
      ],
    },
    {
      title: "Kartu Siswa",
      url: "#",
      icon: IdCard,
      isActive: true,
      roles: ["superadmin"],
      items: [
        {
          title: "Pesanan",
          url: "/dashboard/superadmin/kartu-siswa/orders",
        },
        {
          title: "Template",
          url: "/dashboard/superadmin/kartu-siswa/templates",
        },
      ],
    },
    {
      title: "Sistem Cerdas",
      url: "#",
      icon: Bot,
      isActive: true,
      roles: ["superadmin"],
      items: [
        {
          title: "Automation",
          url: "/dashboard/superadmin/n8n",
        },
        {
          title: "Artificial Inteligence",
          url: "/dashboard/superadmin/ai",
        },
      ],
    },
    {
      title: "Finansial",
      url: "#",
      icon: DollarSign,
      isActive: true,
      roles: ["superadmin"],
      items: [
        {
          title: "Xendit (Payment)",
          url: "/dashboard/superadmin/xendit",
        },
      ],
    },
    {
      title: "Pengaturan Umum",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      roles: ["admin"],
      items: [
        {
          title: "Tahun Ajaran",
          url: "/dashboard/tahun-ajaran",
        },
        {
          title: "Jurusan",
          url: "/dashboard/jurusan",
          requiresJurusan: true, // only SMK/SMA/MA
        },
        {
          title: "Kelas",
          url: "/dashboard/kelas",
        },
        {
          title: "Guru",
          url: "/dashboard/guru",
        },
        {
          title: "Mata Pelajaran",
          url: "/dashboard/mata-pelajaran",
        },
        {
          title: "Pengaturan",
          url: "/dashboard/pengaturan",
        },
      ],
    },
    {
      title: "Akademik",
      url: "#",
      icon: BookOpen,
      roles: ["admin"],
      items: [
        {
          title: "Kurikulum",
          url: "/dashboard/kurikulum",
        },
        {
          title: "Jadwal Pelajaran",
          url: "/dashboard/jadwal-pelajaran",
        },
      ],
    },
    {
      title: "Kesiswaan",
      url: "#",
      icon: Users,
      roles: ["admin"],
      items: [
        {
          title: "Absen Umum",
          url: "/dashboard/absen-umum",
        },
        {
          title: "Disiplin",
          url: "/dashboard/disiplin",
        },
        {
          title: "Kartu Siswa",
          url: "/dashboard/kartu-siswa",
        },
      ],
    },
    {
      title: "Laporan",
      url: "#",
      icon: FileText,
      roles: ["admin", "principal"],
      items: [
        {
          title: "Laporan Absensi Umum",
          url: "/dashboard/laporan/absensi",
        },
        {
          title: "Laporan Jurnal Mapel",
          url: "/dashboard/laporan/jurnal",
        },
        {
          title: "Laporan Disiplin",
          url: "/dashboard/laporan/disiplin",
        },
      ],
    },
    {
      title: "Guru",
      url: "#",
      icon: GraduationCap,
      roles: ["teacher"],
      items: [
        {
          title: "Jurnal",
          url: "/dashboard/teacher/jurnal",
        },
        {
          title: "Piket",
          url: "/dashboard/teacher/piket",
        },
        {
          title: "Absen Perwalian",
          url: "/dashboard/teacher/absen-perwalian",
        },
        {
          title: "Guru Wali",
          url: "/dashboard/guru-wali/dashboard",
        },
        {
          title: "Bimbingan Konseling",
          url: "/dashboard/teacher/bimbingan-konseling",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const router = useRouter()
  const [isMounted, setIsMounted] = React.useState(false)
  const [navMain, setNavMain] = React.useState<NavItem[]>([])
  const [user, setUser] = React.useState({ ...data.user, role: "" })

  React.useEffect(() => {
    setIsMounted(true)
    const role = localStorage.getItem("role") || "guest"
    setUser(prev => ({ ...prev, role }))
    const schoolType = (localStorage.getItem("school_type") || "").toUpperCase()
    // School types that have jurusan (study programs)
    const hasJurusan = ["SMK", "SMA", "MA", "MAK"].includes(schoolType)

    const filteredNav: NavItem[] = (data.navMain as NavItem[])
      .map((item) => ({
        ...item,
        // Filter sub-items that require jurusan if this school has none
        items: item.items?.filter((sub) => !sub.requiresJurusan || hasJurusan),
      }))
      .filter((item) => !item.roles || item.roles.includes(role))
    setNavMain(filteredNav)
  }, [])

  React.useEffect(() => {
    const getUser = async () => {
      try {
        const res = await api.get("/auth/me")
        setUser(prev => ({
          ...prev,
          name: res.data.user.name ?? prev.name,
          email: res.data.user.email ?? prev.email,
        }))
        const features = res.data.features || {}

        const role = localStorage.getItem("role") || "guest"
        const schoolType = (localStorage.getItem("school_type") || "").toUpperCase()
        const hasJurusan = ["SMK", "SMA", "MA", "MAK"].includes(schoolType)

        const filteredNav: NavItem[] = (data.navMain as NavItem[])
          .map((item) => ({
            ...item,
            items: item.items?.filter((sub) => !sub.requiresJurusan || hasJurusan).map(sub => {
              if (sub.title === "Jadwal Pelajaran") {
                return { ...sub, isLocked: features?.import_schedule !== true }
              }
              return sub
            }),
          }))
          .filter((item) => !item.roles || item.roles.includes(role))

        setNavMain(filteredNav)

      } catch (err: unknown) {
        // Only redirect on a real 401 — not timeouts/network errors.
        // The middleware already guards all /dashboard routes globally.
        const axiosErr = err as { response?: { status?: number } }
        console.error("[AppSidebar] getUser failed:", axiosErr?.response?.status, err)
        if (axiosErr?.response?.status === 401) {
          router.push("/auth/login")
        }
        // Otherwise fall through silently — sidebar renders with localStorage role
      }
    }
    getUser()
  }, [router])

  if (!isMounted) {
    return null
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AppName appInfo={data.appInfo} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
