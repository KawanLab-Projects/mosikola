"use client"

import { Button } from "@/components/ui/button";
import {
    Check,
    Menu, X,
    Shield, Clock, BarChart3,
    Zap, Sparkles, Server, Lock, LayoutDashboard,
    ArrowRight, Smartphone
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { PricingSection } from "@/app/components/landing/PricingSection";

export default function LandingPageV2Client() {
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
        <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/20">
            {/* 1. NAVIGATION */}
            <header
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                    isScrolled ? "bg-background/80 backdrop-blur-md border-b border-border shadow-sm py-3" : "bg-transparent py-5"
                )}
            >
                <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <Shield className="w-6 h-6 text-primary" strokeWidth={2.5} />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-primary to-primary/80 tracking-tight">
                            Mosikola
                        </span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8">
                        {['Masalah', 'Fitur', 'Solusi WA', 'Roadmap AI', 'Harga'].map((item, i) => (
                            <button key={i} onClick={() => scrollToSection(item.toLowerCase().replace(' ', '-'))}
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                {item}
                            </button>
                        ))}
                    </nav>

                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/auth/login">
                            <Button variant="ghost" className="font-medium">
                                Masuk
                            </Button>
                        </Link>
                        <Link href="/auth/register">
                            <Button className="font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-sm">
                                Coba Gratis
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg p-4 md:hidden flex flex-col gap-4">
                        {['Masalah', 'Fitur', 'Solusi WA', 'Roadmap AI', 'Harga'].map((item, i) => (
                            <button key={i} onClick={() => scrollToSection(item.toLowerCase().replace(' ', '-'))}
                                className="text-left font-medium py-2 px-4 hover:bg-muted rounded-md text-foreground">
                                {item}
                            </button>
                        ))}
                        <hr className="border-border" />
                        <div className="flex flex-col gap-3 p-2">
                            <Link href="/auth/login" className="w-full">
                                <Button variant="outline" className="w-full justify-center">Masuk</Button>
                            </Link>
                            <Link href="/auth/register" className="w-full">
                                <Button className="w-full justify-center bg-primary hover:bg-primary/90 text-primary-foreground">Coba Gratis</Button>
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            <main className="pt-24 relative z-10">
                {/* 2. HERO SECTION */}
                <section className="relative overflow-hidden pt-12 pb-24 lg:pt-24 lg:pb-32 flex flex-col items-center justify-center min-h-[80vh]">
                    <div className="absolute inset-0 z-0 bg-muted/30"></div>
                    {/* Decorative Blobs */}
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
                    <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

                    <div className="container mx-auto px-4 md:px-6 relative z-10">
                        <motion.div
                            initial="hidden" animate="visible" variants={containerVariants}
                            className="max-w-4xl mx-auto text-center space-y-8"
                        >
                            <motion.div variants={itemVariants} className="inline-flex items-center bg-primary/10 px-4 py-2 rounded-full text-sm font-semibold text-primary mb-4 border border-primary/20">
                                <span className="flex h-2 w-2 relative mr-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full bg-primary opacity-75 rounded-full"></span>
                                    <span className="relative inline-flex h-2 w-2 bg-primary rounded-full"></span>
                                </span>
                                Platform Monitoring Sekolah #1 di Indonesia
                            </motion.div>

                            <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight text-foreground">
                                Orang Tua <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/80">Tenang.</span><br />
                                Sekolah <span className="text-muted-foreground">Terkontrol.</span>
                            </motion.h1>

                            <motion.p variants={itemVariants} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                                Sistem manajemen sekolah multi-tenant yang memusatkan absensi, jurnal guru, dan kedisiplinan siswa dengan insight data berbasis real-time.
                            </motion.p>

                            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                                <Link href="/auth/register">
                                    <Button size="lg" className="h-12 px-8 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-md hover:shadow-lg transition-all">
                                        Coba Gratis Sekarang
                                        <ArrowRight className="ml-2 w-5 h-5" />
                                    </Button>
                                </Link>
                                <Link href="#masalah">
                                    <Button variant="outline" size="lg" className="h-12 px-8 text-base font-semibold rounded-lg bg-background">
                                        Pelajari Lebih Lanjut
                                    </Button>
                                </Link>
                            </motion.div>

                            <motion.div variants={itemVariants} className="flex items-center justify-center gap-2 pt-6 text-muted-foreground font-medium text-sm">
                                <Smartphone className="w-5 h-5 text-primary" />
                                <span>Download di Play Store</span>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                {/* 3. PROBLEM SECTION */}
                <section id="masalah" className="py-24 bg-card text-card-foreground border-y border-border">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center max-w-3xl mb-16 mx-auto">
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6">
                                Mengapa Sekolah Butuh <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/80">Sistem Lebih Baik?</span>
                            </h2>
                            <p className="text-lg text-muted-foreground">
                                Mengelola ratusan siswa dengan kertas dan WhatsApp grup informal adalah mimpi buruk administrasi yang rentan kesalahan.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { title: "Jurnal Manual & Kertas", desc: "Guru menghabiskan waktu menulis jurnal di kelas, menyulitkan rekapitulasi akhir bulan." },
                                { title: "Rekap Absensi Sulit", desc: "Data kehadiran terpisah-pisah, membuat deteksi siswa bolos menjadi lambat." },
                                { title: "Pelanggaran Abstrak", desc: "Buku poin pelanggaran sering hilang, membuat data riwayat kedisiplinan tidak akurat." },
                                { title: "Komunikasi Terputus", desc: "Orang tua seringkali baru tahu anaknya bermasalah setelah surat panggilan peringatan." }
                            ].map((pain, i) => (
                                <div key={i} className="p-6 border border-border bg-muted/30 rounded-2xl hover:border-primary/50 transition-colors shadow-sm">
                                    <div className="w-10 h-10 bg-destructive/10 text-destructive flex items-center justify-center rounded-xl mb-4">
                                        <X className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-2">{pain.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{pain.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 4. SOLUTION & FEATURES GRID */}
                <section id="fitur" className="py-24 bg-muted/30">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <div className="inline-flex items-center bg-primary/10 px-3 py-1 rounded-full text-xs font-semibold text-primary mb-4">
                                Solusi Terintegrasi
                            </div>
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Satu Platform. Semua Terhubung.</h2>
                            <p className="text-lg text-muted-foreground">Desain minimalis, performa maksimal. Kami membangun alat yang benar-benar dipakai guru di lapangan.</p>
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
                                <div key={i} className="bg-card border border-border p-6 rounded-2xl hover:shadow-md transition-all group">
                                    <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-xl mb-4 group-hover:scale-110 transition-transform">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 5. WHATSAPP ADD-ON SECTION */}
                <section id="solusi-wa" className="py-24 bg-card border-y border-border relative overflow-hidden">
                    <div className="container mx-auto px-4 md:px-6 relative z-10">
                        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 md:p-12">
                            <div className="grid lg:grid-cols-5 gap-12 items-center">
                                <div className="lg:col-span-3 space-y-6">
                                    <span className="inline-block px-3 py-1 bg-green-500/10 text-green-600 font-bold text-xs uppercase tracking-wider rounded-full border border-green-500/20">
                                        Optional Add-On
                                    </span>

                                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                        Notifikasi Sekolah Otomatis <span className="text-green-600">via WhatsApp</span>
                                    </h2>

                                    <p className="text-lg text-muted-foreground">
                                        Aktifkan notifikasi otomatis ke guru dan orang tua untuk komunikasi yang cepat dan super responsif langsung ke HP tanpa perlu install aplikasi.
                                    </p>

                                    <div className="grid sm:grid-cols-2 gap-4 pt-4">
                                        {["Notifikasi absensi siswa", "Peringatan pelanggaran", "Pengumuman kegiatan", "Reminder administrasi"].map((useCase, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="bg-green-100 p-1 rounded-full shrink-0">
                                                    <Check className="text-green-600 w-4 h-4" strokeWidth={3} />
                                                </div>
                                                <span className="font-medium text-foreground">{useCase}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-background border border-border p-6 rounded-2xl shadow-sm">
                                        <p className="text-sm font-semibold text-muted-foreground mb-1">Paket Guru</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-extrabold">Rp 15.000</span>
                                            <span className="text-muted-foreground text-sm">/guru/bulan</span>
                                        </div>
                                    </div>

                                    <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl shadow-sm relative">
                                        <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-sm">Paling Diminati</div>
                                        <p className="text-sm font-semibold text-primary mb-1">Paket Orang Tua</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-extrabold text-foreground">Rp 10.000</span>
                                            <span className="text-muted-foreground text-sm">/siswa/bulan</span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-muted-foreground text-center">
                                        * Diaktifkan oleh pihak sekolah, pembayaran melalui aplikasi.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 6. ROADMAP AI SECTION */}
                <section id="roadmap-ai" className="py-24 bg-muted/30">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <span className="inline-flex items-center px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-600 font-bold text-xs uppercase tracking-wider rounded-full mb-4">
                                <Sparkles className="w-3 h-3 mr-2" /> Future Updates
                            </span>
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Sistem Cerdas Berbasis AI</h2>
                            <p className="text-lg text-muted-foreground">Mosikola bukan sekadar buku catatan digital. Kami membangun otak analitik untuk membantu sekolah proaktif menekan kenakalan siswa.</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { title: "Rekomendasi Penanganan BK", status: "Coming Soon" },
                                { title: "Analisis Tren Perilaku", status: "In Development" },
                                { title: "Early Warning System", status: "Planned" },
                                { title: "Insight Kepala Sekolah", status: "Planned" }
                            ].map((ai, i) => (
                                <div key={i} className="border border-border bg-card rounded-2xl p-6 text-center hover:border-blue-500/50 hover:shadow-sm transition-all shadow-xs">
                                    <div className="mx-auto w-12 h-12 bg-blue-500/10 flex items-center justify-center rounded-xl mb-4">
                                        <Zap className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h4 className="font-bold text-foreground mb-3">{ai.title}</h4>
                                    <span className="text-xs font-semibold text-blue-600 bg-blue-500/10 px-3 py-1 rounded-full">{ai.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 7. PRICING SECTION */}
                <section id="harga" className="py-24 bg-card border-t border-border">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Harga Jujur & Transparan</h2>
                            <p className="text-lg text-muted-foreground">Harga khusus <span className="font-semibold text-primary">Pengguna Awal</span>. Tanpa biaya instalasi tersembunyi.</p>
                        </div>
                        <PricingSection />
                    </div>
                </section>

                {/* 8. TRUST & FINAL CTA */}
                <section className="py-24 bg-muted/50 border-t border-border">
                    <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
                        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">
                            Siap Digitalisasi Sekolah Anda?
                        </h2>
                        <p className="text-lg text-muted-foreground mb-10">
                            Platform cloud-based dengan backup harian otomatis, keamanan role-based, dan enkripsi data mumpuni. Tidak perlu instalasi server rumit.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/auth/register">
                                <Button size="lg" className="h-14 px-8 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-md transition-all">
                                    Mulai Gratis Sekarang
                                </Button>
                            </Link>
                            <Button variant="outline" size="lg" className="h-14 px-8 text-base font-semibold rounded-lg bg-background">
                                Hubungi Tim Kami
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            {/* 9. FOOTER */}
            <footer className="bg-card py-12 border-t border-border">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div className="col-span-1 md:col-span-2 space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="bg-primary/10 p-2 rounded-lg">
                                    <Shield className="w-5 h-5 text-primary" />
                                </div>
                                <span className="text-xl font-bold tracking-tight text-foreground">Mosikola</span>
                            </div>
                            <p className="max-w-sm text-muted-foreground text-sm leading-relaxed">
                                Infrastruktur cerdas untuk sekolah cerdas. Mengubah administrasi manual menjadi analitik berbasis data.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold text-foreground mb-4">Produk</h4>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li><a href="#fitur" className="hover:text-primary transition-colors">Fitur Aplikasi</a></li>
                                <li><a href="#solusi-wa" className="hover:text-primary transition-colors">Integrasi WhatsApp</a></li>
                                <li><a href="#roadmap-ai" className="hover:text-primary transition-colors">Platform AI</a></li>
                                <li><a href="#harga" className="hover:text-primary transition-colors">Harga</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-foreground mb-4">KawanLab Teknologi Nusantara</h4>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li><a href="#" className="hover:text-primary transition-colors">Tentang Kami</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Hubungi Sales</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Keamanan Data</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Syarat Ketentuan</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
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
