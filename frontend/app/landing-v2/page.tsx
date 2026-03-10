import { Metadata } from 'next'
import LandingPageV2Client from './page-client'

export const metadata: Metadata = {
    title: 'Mosikola - Sistem Manajemen Sekolah',
    description: 'Sistem manajemen sekolah multi-tenant yang memusatkan absensi, jurnal guru, dan kedisiplinan siswa dengan insight data berbasis real-time.',
}

export default function LandingPageV2() {
    return <LandingPageV2Client />
}
