"use client"

import { Button } from "@/components/ui/button";
import {
    Check,
    Menu, X,
    Shield, Clock, BarChart3, Users, ChevronRight,
    Zap, Database, Activity, MessagesSquare, Sparkles, Server, Lock, LayoutDashboard,
    Smartphone
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function LandingPageClient() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
            setMobileMenuOpen(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
    };

    return (
        <div className="min-h-screen bg-zinc-50 font-sans selection:bg-teal-500/30 text-zinc-950">
            {/* INVISIBLE GRID BACKGROUND FOR TECHNICAL FEEL */}
            <div className="fixed inset-0 pointer-events-none z-0"
                style={{ backgroundImage: 'linear-gradient(to right, #e4e4e7 1px, transparent 1px), linear-gradient(to bottom, #e4e4e7 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.4 }}>
            </div>

            {/* 1. NAVIGATION */}
            <header
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
                    isScrolled ? "bg-white/90 backdrop-blur-md border-zinc-200 shadow-xs py-3" : "bg-zinc-50/80 backdrop-blur-sm border-transparent py-5"
                )}
            >
                <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-zinc-950 p-2 border border-zinc-800 rounded-sm">
                            <Shield className="w-5 h-5 text-teal-400" strokeWidth={2.5} />
                        </div>
                        <span className="text-xl font-extrabold tracking-tight">
                            MOSIKOLA
                        </span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8">
                        {['Masalah', 'Fitur', 'Solusi WA', 'Roadmap AI', 'Harga'].map((item, i) => (
                            <button key={i} onClick={() => scrollToSection(item.toLowerCase().replace(' ', '-'))}
                                className="text-sm font-semibold text-zinc-600 hover:text-zinc-950 transition-colors uppercase tracking-wider">
                                {item}
                            </button>
                        ))}
                    </nav>

                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/auth/login">
                            <Button variant="ghost" className="font-semibold text-zinc-600 hover:text-zinc-950 rounded-sm uppercase tracking-wider text-xs">
                                Masuk
                            </Button>
                        </Link>
                        <Link href="/auth/register">
                            <Button className="font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-sm active:scale-95 transition-transform uppercase tracking-wider text-xs shadow-[0_4px_0_0_rgb(15,90,83)] hover:shadow-[0_2px_0_0_rgb(15,90,83)] hover:translate-y-[2px]">
                                Coba Gratis
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-zinc-600 hover:text-zinc-950"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-white border-b border-zinc-200 shadow-xl p-4 md:hidden flex flex-col gap-4">
                        {['Masalah', 'Fitur', 'Solusi WA', 'Roadmap AI', 'Harga'].map((item, i) => (
                            <button key={i} onClick={() => scrollToSection(item.toLowerCase().replace(' ', '-'))}
                                className="text-left font-semibold py-2 px-4 hover:bg-zinc-100 uppercase tracking-wider text-sm">
                                {item}
                            </button>
                        ))}
                        <hr className="border-border" />
                        <div className="flex flex-col gap-3 p-2">
                            <Link href="/auth/login" className="w-full">
                                <Button variant="outline" className="w-full justify-center rounded-sm uppercase font-bold text-xs tracking-wider">Masuk</Button>
                            </Link>
                            <Link href="/auth/register" className="w-full">
                                <Button className="w-full justify-center bg-teal-700 hover:bg-teal-800 text-white rounded-sm uppercase font-bold text-xs tracking-wider">Coba Gratis</Button>
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            <main className="pt-32 relative z-10">
                {/* 2. HERO SECTION */}
                <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32">
                    <div className="container mx-auto px-4 md:px-6">
                        <motion.div
                            initial="hidden" animate="visible" variants={containerVariants}
                            className="max-w-5xl mx-auto text-center space-y-8"
                        >
                            <motion.div variants={itemVariants} className="inline-flex items-center border border-zinc-200 bg-white px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-widest text-zinc-600 mb-4 shadow-sm">
                                <span className="flex h-2 w-2 relative mr-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full bg-teal-400 opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 bg-teal-500"></span>
                                </span>
                                Platform Monitoring Sekolah #1 di Indonesia
                            </motion.div>

                            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] text-zinc-950">
                                ORANG TUA <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-700 to-teal-500">TENANG.</span><br />
                                SEKOLAH <span className="text-zinc-400">TERKONTROL.</span>
                            </motion.h1>

                            <motion.p variants={itemVariants} className="text-xl md:text-2xl text-zinc-600 max-w-2xl mx-auto font-medium leading-snug">
                                Sistem manajemen sekolah multi-tenant yang memusatkan absensi, jurnal guru, dan kedisiplinan siswa dengan insight data berbasis real-time.
                            </motion.p>

                            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                                <Link href="/auth/register">
                                    <Button size="lg" className="h-14 px-8 text-sm font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-sm uppercase tracking-wider shadow-[0_6px_0_0_rgb(15,90,83)] hover:shadow-[0_2px_0_0_rgb(15,90,83)] hover:translate-y-[4px] transition-all active:scale-95">
                                        Coba Gratis Sekarang
                                        <ChevronRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </Link>
                                <Link href="#masalah">
                                    <Button variant="outline" size="lg" className="h-14 px-8 text-sm font-bold border-2 border-zinc-200 hover:border-zinc-900 rounded-sm uppercase tracking-wider text-zinc-900 bg-transparent hover:bg-zinc-100 transition-colors">
                                        Lihat Fitur
                                    </Button>
                                </Link>
                            </motion.div>

                            <motion.div variants={itemVariants} className="flex items-center justify-center gap-2 pt-6 text-zinc-500 font-bold uppercase tracking-wider text-xs">
                                <Smartphone className="w-4 h-4 text-teal-600" />
                                <span>Sudah Termasuk Aplikasi Mobile iOS & Android</span>
                            </motion.div>
                        </motion.div>

                        {/* DASHBOARD MOCKUP WIREFRAME */}
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 30 }}
                            className="mt-20 max-w-6xl mx-auto border-2 border-zinc-900 bg-white rounded-sm shadow-[8px_8px_0_0_rgba(24,24,27,1)] overflow-hidden relative"
                        >
                            {/* Browser Bar */}
                            <div className="h-12 border-b-2 border-zinc-900 bg-zinc-100 flex items-center px-4 gap-2">
                                <div className="w-3 h-3 rounded-full border-2 border-zinc-900 bg-white"></div>
                                <div className="w-3 h-3 rounded-full border-2 border-zinc-900 bg-white"></div>
                                <div className="w-3 h-3 rounded-full border-2 border-zinc-900 bg-white"></div>
                                <div className="ml-4 h-6 w-64 border-2 border-zinc-900 bg-white rounded-sm flex items-center px-2">
                                    <span className="text-[10px] font-bold text-zinc-400">mosikola.com/dashboard</span>
                                </div>
                            </div>

                            <div className="flex h-[400px] md:h-[600px]">
                                {/* Sidebar */}
                                <div className="w-48 border-r-2 border-zinc-900 bg-zinc-50 hidden md:flex flex-col py-6 px-4 gap-4">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className={`h-8 border-2 border-zinc-900 rounded-sm ${i === 0 ? 'bg-teal-100' : 'bg-white'}`}></div>
                                    ))}
                                </div>
                                {/* Main Content */}
                                <div className="flex-1 p-6 flex flex-col gap-6 bg-white overflow-hidden relative">
                                    <div className="flex justify-between items-center">
                                        <div className="w-48 h-10 border-2 border-zinc-900 bg-zinc-100 rounded-sm"></div>
                                        <div className="w-10 h-10 border-2 border-zinc-900 rounded-full bg-orange-100"></div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[...Array(4)].map((_, i) => (
                                            <div key={i} className="h-24 border-2 border-zinc-900 bg-white rounded-sm p-4 flex flex-col justify-between">
                                                <div className="w-8 h-8 border-2 border-zinc-900 rounded-sm bg-zinc-100"></div>
                                                <div className="w-1/2 h-4 border-2 border-zinc-900 bg-teal-50"></div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex-1 border-2 border-zinc-900 bg-zinc-50 rounded-sm p-4 relative overflow-hidden">
                                        {/* Chart wireframe */}
                                        <div className="absolute bottom-0 left-4 right-4 h-48 flex items-end gap-2">
                                            {[40, 70, 50, 90, 60, 80, 50, 100].map((h, i) => (
                                                <div key={i} className="flex-1 border-2 border-zinc-900 bg-teal-100 border-b-0 rounded-t-sm" style={{ height: `${h}%` }}></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* 3. PROBLEM SECTION (Dark Mode Contrast) */}
                <section id="masalah" className="py-24 bg-zinc-950 text-zinc-50 relative overflow-hidden">
                    <div className="absolute inset-0 z-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
                    <div className="container mx-auto px-4 md:px-6 relative z-10">
                        <div className="max-w-3xl mb-16">
                            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-6">
                                Mengapa Sekolah Butuh <span className="text-orange-500">Sistem Lebih Baik?</span>
                            </h2>
                            <p className="text-xl text-zinc-400 font-medium">
                                Mengelola ratusan siswa dengan kertas dan WhatsApp grup informal adalah mimpi buruk administrasi.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {[
                                { title: "Jurnal Manual & Kertas", desc: "Guru menghabiskan waktu menulis jurnal di kelas, menyulitkan rekapitulasi akhir bulan." },
                                { title: "Rekap Absensi Sulit", desc: "Data kehadiran terpisah-pisah, membuat deteksi siswa bolos menjadi lambat." },
                                { title: "Pelanggaran Tidak Tercatat", desc: "Buku poin pelanggaran sering hilang, membuat data riwayat kedisiplinan tidak akurat." },
                                { title: "Komunikasi Orang Tua Terputus", desc: "Orang tua seringkali baru tahu anaknya bermasalah setelah surat panggilan peringatan." }
                            ].map((pain, i) => (
                                <div key={i} className="p-8 border border-zinc-800 bg-zinc-900/50 rounded-sm hover:border-orange-500/50 transition-colors">
                                    <div className="w-12 h-12 bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center rounded-sm mb-6">
                                        <X className="w-6 h-6 text-orange-500" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{pain.title}</h3>
                                    <p className="text-zinc-400">{pain.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 4. SOLUTION SECTION */}
                <section className="py-24 bg-white border-b-2 border-zinc-200">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8">
                                <div className="inline-flex items-center px-3 py-1 bg-teal-50 border border-teal-200 text-teal-800 font-bold uppercase text-xs tracking-widest rounded-sm">
                                    Solusi Terintegrasi
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-950 uppercase leading-none">
                                    Satu Platform.<br />Semua Data Terhubung.
                                </h2>
                                <p className="text-lg text-zinc-600 font-medium">
                                    Dari mulai siswa masuk gerbang hingga laporan semester, Mosikola memastikan tidak ada data yang tercecer.
                                </p>

                                <ul className="space-y-4">
                                    {[
                                        "Jurnal Otomatis Berbasis Jadwal",
                                        "Rekap Absensi Diperbarui Real-time",
                                        "Manajemen Poin & Pelanggaran Digital",
                                        "Multi-tenant System (Subdomain per sekolah)"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 font-semibold text-zinc-800">
                                            <div className="p-1 bg-teal-100 border border-teal-300 rounded-sm">
                                                <Check className="w-5 h-5 text-teal-700" strokeWidth={3} />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="relative">
                                {/* Abstract wireframe illustration for solution */}
                                <div className="aspect-square bg-zinc-50 border-2 border-zinc-900 rounded-sm p-8 relative shadow-[8px_8px_0_0_rgba(15,118,110,1)]">
                                    <div className="grid grid-cols-2 gap-4 h-full">
                                        <div className="border-2 border-zinc-900 bg-white p-4 flex flex-col justify-between">
                                            <Database className="w-8 h-8 text-zinc-400" />
                                            <div className="h-2 bg-zinc-200 w-1/2"></div>
                                        </div>
                                        <div className="border-2 border-zinc-900 bg-teal-100 p-4 flex flex-col justify-between translate-y-8 shadow-[4px_4px_0_0_rgba(24,24,27,1)] relative z-10">
                                            <Activity className="w-8 h-8 text-teal-700" />
                                            <div className="h-2 bg-teal-300 w-3/4"></div>
                                        </div>
                                        <div className="border-2 border-zinc-900 bg-orange-100 p-4 flex flex-col justify-between -translate-y-8 shadow-[4px_4px_0_0_rgba(24,24,27,1)] relative z-10">
                                            <Users className="w-8 h-8 text-orange-600" />
                                            <div className="h-2 bg-orange-300 w-2/3"></div>
                                        </div>
                                        <div className="border-2 border-zinc-900 bg-white p-4 flex flex-col justify-between">
                                            <Server className="w-8 h-8 text-zinc-400" />
                                            <div className="h-2 bg-zinc-200 w-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. FEATURES GRID */}
                <section id="fitur" className="py-24 bg-zinc-50">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-4xl font-black uppercase tracking-tight text-zinc-950 mb-4">Fitur Utama</h2>
                            <p className="text-lg text-zinc-600">Desain minimalis, performa maksimal. Kami membangun alat yang benar-benar dipakai guru di lapangan.</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { title: "Jurnal Guru", desc: "Input materi dan absensi langsung di kelas sesuai jadwal mengajar secara digital.", icon: <LayoutDashboard /> },
                                { title: "Absensi Otomatis", desc: "Rekap absensi mapel dan harian terintegrasi otomatis untuk laporan akhir bulan.", icon: <Clock /> },
                                { title: "Piket & Pelanggaran", desc: "Catat siswa terlambat dan pelanggaran dengan sistem poin otomatis sesuai aturan.", icon: <Shield /> },
                                { title: "Dashboard Akademik", desc: "Ringkasan data untuk kepala sekolah melihat performa kehadiran & indisipliner.", icon: <BarChart3 /> },
                                { title: "Subdomain Khusus", desc: "Setiap sekolah mendapat identitas mandiri (smkn1.mosikola.com).", icon: <Server /> },
                                { title: "Keamanan Role-Based", desc: "Hak akses terpisah ketat antara admin, guru, BK, dan kepala sekolah.", icon: <Lock /> },
                            ].map((feature, i) => (
                                <div key={i} className="bg-white border-2 border-zinc-200 p-6 rounded-sm hover:border-zinc-900 hover:shadow-[4px_4px_0_0_rgba(24,24,27,1)] transition-all">
                                    <div className="w-12 h-12 bg-zinc-100 border border-zinc-300 flex items-center justify-center rounded-sm mb-4">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                    <p className="text-zinc-600 font-medium">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 6. WHATSAPP ADD-ON SECTION */}
                <section id="solusi-wa" className="py-24 bg-teal-900 border-y-4 border-zinc-950 relative overflow-hidden">
                    {/* Decorative pattern */}
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <MessagesSquare className="w-96 h-96 text-white" />
                    </div>

                    <div className="container mx-auto px-4 md:px-6 relative z-10">
                        <div className="grid lg:grid-cols-5 gap-12 items-center">
                            <div className="lg:col-span-3 space-y-8">
                                <span className="inline-block px-4 py-2 bg-orange-500 text-white font-black uppercase text-sm tracking-widest border-2 border-zinc-950 shadow-[4px_4px_0_0_rgba(24,24,27,1)]">
                                    Optional Add-On
                                </span>

                                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white leading-none">
                                    Notifikasi Sekolah Otomatis <span className="text-orange-500">via WhatsApp</span>
                                </h2>

                                <p className="text-xl text-teal-100 font-medium max-w-xl">
                                    Aktifkan notifikasi otomatis ke guru dan orang tua untuk komunikasi yang cepat dan super responsif langsung ke HP tanpa perlu install aplikasi.
                                </p>

                                <div className="grid sm:grid-cols-2 gap-4 pt-4">
                                    {["Notifikasi absensi siswa", "Peringatan pelanggaran", "Pengumuman kegiatan", "Reminder administrasi"].map((useCase, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-teal-800/50 p-3 border border-teal-700 rounded-sm">
                                            <Check className="text-orange-400 w-5 h-5 shrink-0" />
                                            <span className="text-white font-medium">{useCase}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="lg:col-span-2">
                                <div className="bg-white border-4 border-zinc-950 p-8 rounded-sm shadow-[12px_12px_0_0_rgba(234,88,12,1)] transform md:-rotate-2">
                                    <h3 className="text-2xl font-black uppercase text-zinc-950 mb-6 border-b-2 border-zinc-200 pb-4">Biaya Berlangganan (Opsional)</h3>

                                    <div className="space-y-6">
                                        <div className="p-4 border-2 border-zinc-200 bg-zinc-50 rounded-sm">
                                            <p className="text-sm font-bold uppercase text-zinc-500 mb-1">Paket Guru</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black">Rp 15.000</span>
                                                <span className="text-zinc-500 font-medium">/guru/bulan</span>
                                            </div>
                                        </div>

                                        <div className="p-4 border-2 border-zinc-950 bg-orange-50 rounded-sm relative">
                                            <div className="absolute -top-3 right-4 bg-orange-500 text-white text-[10px] font-black uppercase px-2 py-1">Paling Diminati</div>
                                            <p className="text-sm font-bold uppercase text-orange-700 mb-1">Paket Orang Tua</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black text-zinc-950">Rp 10.000</span>
                                                <span className="text-zinc-600 font-medium">/siswa/bulan</span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-xs text-zinc-500 mt-6 font-medium">
                                        * Diaktifkan oleh pihak sekolah, pembayaran melalui subscribe di aplikasi mobile.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 7. ROADMAP AI SECTION */}
                <section id="roadmap-ai" className="py-24 bg-white">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <span className="inline-flex items-center px-3 py-1 bg-zinc-100 border-2 border-zinc-300 text-zinc-600 font-bold uppercase text-xs tracking-widest rounded-sm mb-6">
                                <Zap className="w-4 h-4 mr-2" /> Future Updates
                            </span>
                            <h2 className="text-4xl font-black uppercase tracking-tight text-zinc-950 mb-4">Sistem Cerdas berbasis AI</h2>
                            <p className="text-lg text-zinc-600">Mosikola bukan sekadar buku catatan digital. Kami membangun otak analitik untuk membantu sekolah proaktif menekan kenakalan siswa.</p>
                        </div>

                        <div className="grid md:grid-cols-4 gap-4">
                            {[
                                { title: "Rekomendasi Penanganan BK", status: "Coming Soon" },
                                { title: "Analisis Tren Perilaku", status: "In Development" },
                                { title: "Early Warning System (EWS)", status: "Planned" },
                                { title: "Insight Kepala Sekolah", status: "Planned" }
                            ].map((ai, i) => (
                                <div key={i} className="border-2 border-zinc-200 border-dashed rounded-sm p-6 bg-zinc-50 text-center hover:border-teal-500 transition-colors cursor-default">
                                    <Sparkles className="w-8 h-8 mx-auto text-teal-400 mb-4" />
                                    <h4 className="font-bold text-lg mb-2">{ai.title}</h4>
                                    <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-100 px-2 py-1 rounded-sm">{ai.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 8. PRICING SECTION */}
                <section id="harga" className="py-24 bg-zinc-50 border-t-2 border-zinc-200">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-4xl font-black uppercase tracking-tight text-zinc-950 mb-4">Harga Jujur & Transparan</h2>
                            <p className="text-lg text-zinc-600">Harga khusus <span className="font-bold text-teal-700">Pengguna Awal</span>. Tanpa biaya instalasi tersembunyi.</p>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Free Plan */}
                            <div className="bg-white border-2 border-zinc-200 rounded-sm p-8 flex flex-col">
                                <div className="mb-6">
                                    <h3 className="text-xl font-black uppercase mb-2">Free</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black">Rp 0</span>
                                    </div>
                                    <p className="text-zinc-500 text-sm mt-2 font-medium">Default saat registrasi awal.</p>
                                </div>
                                <div className="flex-1 border-t-2 border-dashed border-zinc-200 pt-6">
                                    <ul className="space-y-4">
                                        <li className="font-bold border-b pb-2">Kapasitas</li>
                                        <li className="flex gap-2 text-zinc-600 text-sm"><Check className="w-4 h-4 text-teal-600 shrink-0" /> Maks 6 Guru</li>
                                        <li className="flex gap-2 text-zinc-600 text-sm"><Check className="w-4 h-4 text-teal-600 shrink-0" /> Maks 35 Siswa</li>
                                        <li className="font-bold border-b pb-2 mt-4 pt-4">Fitur Utama</li>
                                        <li className="flex gap-2 text-zinc-600 text-sm"><Check className="w-4 h-4 text-teal-600 shrink-0" /> Generator Jadwal Algoritmik</li>
                                        <li className="flex gap-2 text-zinc-600 text-sm"><Check className="w-4 h-4 text-teal-600 shrink-0" /> Jurnal & Absensi Mapel</li>
                                        <li className="flex gap-2 text-zinc-600 text-sm"><Check className="w-4 h-4 text-teal-600 shrink-0" /> Piket & Fitur Bimbingan Konseling</li>
                                        <li className="flex gap-2 text-zinc-600 text-sm"><Check className="w-4 h-4 text-teal-600 shrink-0" /> Dashboard KepSek Basic</li>
                                    </ul>
                                </div>
                                <Button variant="outline" className="w-full mt-8 border-2 border-zinc-200 text-zinc-900 rounded-sm uppercase font-bold tracking-wider h-12">Mulai Gratis</Button>
                            </div>

                            {/* Perintis Plan */}
                            <div className="bg-zinc-950 text-white border-2 border-zinc-950 rounded-sm p-8 flex flex-col relative shadow-[8px_8px_0_0_rgba(15,118,110,1)] -translate-y-2">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-teal-500 text-zinc-950 font-black uppercase text-xs px-4 py-1 border-2 border-zinc-950">
                                    Paling Cocok Untuk Mulai
                                </div>
                                <div className="mb-6">
                                    <h3 className="text-xl font-black uppercase mb-2 text-teal-400">Perintis</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black">Rp 79.000</span>
                                        <span className="text-zinc-400 text-sm font-medium">/ bln</span>
                                    </div>
                                </div>
                                <div className="flex-1 border-t-2 border-dashed border-zinc-800 pt-6">
                                    <ul className="space-y-4">
                                        <li className="font-bold border-b border-zinc-800 pb-2">Kapasitas</li>
                                        <li className="flex gap-2 text-zinc-300 text-sm"><Check className="w-4 h-4 text-teal-400 shrink-0" /> Maks 30 Guru</li>
                                        <li className="flex gap-2 text-zinc-300 text-sm"><Check className="w-4 h-4 text-teal-400 shrink-0" /> Maks 300 Siswa</li>
                                        <li className="font-bold border-b border-zinc-800 pb-2 mt-4 pt-4">Fitur Lengkap</li>
                                        <li className="flex gap-2 text-zinc-300 text-sm"><Check className="w-4 h-4 text-teal-400 shrink-0" /> Semua fitur Free plan</li>
                                        <li className="flex gap-2 text-zinc-300 text-sm"><Check className="w-4 h-4 text-teal-400 shrink-0" /> Import Jadwal XML</li>
                                        <li className="flex gap-2 text-zinc-300 text-sm"><Check className="w-4 h-4 text-teal-400 shrink-0" /> Support teknis standar</li>
                                    </ul>
                                </div>
                                <div className="w-full mt-8 bg-zinc-900 border-2 border-zinc-800 text-zinc-400 p-3 rounded-sm text-center text-xs font-semibold leading-relaxed">
                                    Silakan daftar dan coba paket Free terlebih dahulu untuk upgrade ke paket ini.
                                </div>
                            </div>

                            {/* Favorit / Excellence Combo */}
                            <div className="flex flex-col gap-6">
                                <div className="bg-white border-2 border-zinc-200 rounded-sm p-6 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-black uppercase">Favorit</h3>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-2xl font-black">Rp 249k</span><span className="text-xs text-zinc-500">/bln</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ul className="space-y-2 mb-6 text-sm">
                                        <li className="flex gap-2 text-zinc-600"><Check className="w-4 h-4 text-teal-600" /> Maks 80 Guru, 1000 Siswa</li>
                                        <li className="flex gap-2 text-zinc-600"><Check className="w-4 h-4 text-teal-600" /> AI Helper Bimbingan Konseling</li>
                                    </ul>
                                    <div className="w-full mt-auto bg-zinc-50 border-2 border-zinc-200 text-zinc-500 p-2 rounded-sm text-center text-[10px] font-semibold leading-relaxed">
                                        Silakan daftar dan coba paket Free terlebih dahulu untuk upgrade ke paket ini.
                                    </div>
                                </div>

                                <div className="bg-white border-2 border-zinc-200 rounded-sm p-6 flex flex-col bg-linear-to-br from-orange-50 to-white">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-black uppercase text-orange-600">Excellence</h3>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-2xl font-black">Rp 599k</span><span className="text-xs text-zinc-500">/bln</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ul className="space-y-2 mb-6 text-sm">
                                        <li className="flex gap-2 text-zinc-600"><Check className="w-4 h-4 text-orange-500" /> Unlimited Guru & Siswa</li>
                                        <li className="flex gap-2 text-zinc-600"><Check className="w-4 h-4 text-orange-500" /> AI & EWS Analitik Full</li>
                                    </ul>
                                    <div className="w-full mt-auto bg-orange-50 border-2 border-orange-200 text-orange-600/80 p-2 rounded-sm text-center text-[10px] font-semibold leading-relaxed">
                                        Silakan daftar dan coba paket Free terlebih dahulu untuk upgrade ke paket ini.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 9. TRUST & FINAL CTA */}
                <section className="py-24 bg-teal-50 border-t-2 border-teal-200">
                    <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-zinc-950 mb-6">
                            Siap Digitalisasi Sekolah Anda?
                        </h2>
                        <p className="text-xl text-zinc-600 mb-10 font-medium">
                            Platform cloud-based dengan backup harian otomatis, keamanan role-based, dan enkripsi data mumpuni.  Tidak perlu instalasi server rumit.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/auth/register">
                                <Button size="lg" className="h-16 px-10 text-lg font-black bg-zinc-950 hover:bg-zinc-800 text-white rounded-sm uppercase tracking-widest shadow-[8px_8px_0_0_rgba(15,118,110,1)] hover:shadow-[4px_4px_0_0_rgba(15,118,110,1)] hover:translate-y-1 hover:translate-x-1 transition-all">
                                    Mulai Gratis
                                </Button>
                            </Link>
                            <Button variant="outline" size="lg" className="h-16 px-10 text-lg font-black border-2 border-zinc-950 text-zinc-950 bg-white rounded-sm uppercase tracking-widest hover:bg-zinc-100 transition-colors">
                                Hubungi Tim Kami
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            {/* 10. FOOTER */}
            <footer className="bg-zinc-950 py-12 border-t-4 border-teal-500 text-zinc-400">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div className="col-span-1 md:col-span-2 space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-sm">
                                    <Shield className="w-6 h-6 text-teal-400" />
                                </div>
                                <span className="text-2xl font-black text-white uppercase tracking-tight">Mosikola</span>
                            </div>
                            <p className="max-w-sm font-medium">
                                Infrastruktur cerdas untuk sekolah cerdas. Mengubah administrasi manual menjadi analitik berbasis data.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold text-white uppercase tracking-wider mb-4">Produk</h4>
                            <ul className="space-y-3 text-sm font-medium">
                                <li><a href="#fitur" className="hover:text-teal-400 transition-colors">Fitur Aplikasi</a></li>
                                <li><a href="#solusi-wa" className="hover:text-teal-400 transition-colors">Integrasi WhatsApp</a></li>
                                <li><a href="#roadmap-ai" className="hover:text-teal-400 transition-colors">Platform AI</a></li>
                                <li><a href="#harga" className="hover:text-teal-400 transition-colors">Harga</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white uppercase tracking-wider mb-4">Perusahaan</h4>
                            <ul className="space-y-3 text-sm font-medium">
                                <li><a href="#" className="hover:text-teal-400 transition-colors">Tentang Kami</a></li>
                                <li><a href="#" className="hover:text-teal-400 transition-colors">Hubungi Sales</a></li>
                                <li><a href="#" className="hover:text-teal-400 transition-colors">Keamanan Data</a></li>
                                <li><a href="#" className="hover:text-teal-400 transition-colors">Syarat Ketentuan</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t-2 border-zinc-900 pt-8 flex flex-col md:flex-row justify-between items-center text-sm font-medium">
                        <p>&copy; {new Date().getFullYear()} Mosikola. All rights reserved.</p>
                        <div className="flex gap-4 mt-4 md:mt-0">
                            <span>Dibangun untuk pendidikan Indonesia.</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
