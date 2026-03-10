import { Metadata } from "next";
import LandingPageV2 from "./landing-v2/page";

export const metadata: Metadata = {
    title: "Mosikola | Platform Manajemen Sekolah Modern Berbasis Data",
    description: "Aplikasi manajemen sekolah SaaS untuk SD, SMP, SMA, dan SMK. Dilengkapi jurnal guru, absensi, pelanggaran, hingga fitur integrasi WhatsApp dan roadmap AI pendeteksi risiko siswa.",
    openGraph: {
        title: "Mosikola | Platform Manajemen Sekolah Modern",
        description: "Sistem sekolah multi-tenant yang membantu mendigitalisasi kehadiran, jurnal, dan kedisiplinan siswa dengan insight data.",
        url: "https://mosikola.com",
        siteName: "Mosikola",
        images: [
            {
                url: "/og-image.jpg", // To be added later
                width: 1200,
                height: 630,
                alt: "Mosikola Dashboard",
            },
        ],
        locale: "id_ID",
        type: "website",
    },
};

export default function Page() {
    return <LandingPageV2 />;
}