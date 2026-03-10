"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Shield, Building2, User, Mail, Phone, Loader2, Globe } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function RegisterPage() {

    // Form States
    const [npsn, setNpsn] = useState("");
    const [schoolName, setSchoolName] = useState("");
    const [subdomain, setSubdomain] = useState("");
    const [schoolType, setSchoolType] = useState("");
    const [isLoadingSchool, setIsLoadingSchool] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const slugify = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')     // Replace spaces with -
            .replace(/[^\w-]+/g, '')  // Remove all non-word chars
            .replace(/--+/g, '-')     // Replace multiple - with single -
            .replace(/^-+/, '')       // Trim - from start of text
            .replace(/-+$/, '');      // Trim - from end of text
    };

    // NPSN Lookup
    const handleNpsnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, ''); // Only allow numbers
        setNpsn(value);

        // Reset if NPSN is changed
        if (value.length < 8) {
            setSchoolName("");
            setSubdomain("");
            setSchoolType("");
        }

        // Trigger lookup when 8 digits
        if (value.length === 8) {
            performNpsnLookup(value);
        }
    };

    const performNpsnLookup = async (npsnValue: string) => {
        setIsLoadingSchool(true);

        try {
            const response = await fetch(`https://api.fazriansyah.eu.org/v1/sekolah?npsn=${npsnValue}`);
            const result = await response.json();

            const school = result.data?.satuanPendidikan;

            if (school) {
                const name = school.nama;
                setSchoolName(name);
                setSubdomain(slugify(name));
                setSchoolType(school.bentukPendidikan);
                toast.success("Sekolah ditemukan!", {
                    description: `${name} terdaftar.`
                });
            } else {
                setSchoolName("");
                setSubdomain("");
                setSchoolType("");
                toast.error("NPSN tidak ditemukan", {
                    description: "Pastikan NPSN yang Anda masukkan benar."
                });
            }
        } catch (error) {
            console.error("Lookup error:", error);
            toast.error("Gagal menghubungi server data sekolah");
        } finally {
            setIsLoadingSchool(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            school_name: formData.get("school_name"),
            slug: formData.get("subdomain"),
            school_type: schoolType,
            email: formData.get("email"),
            pic_name: formData.get("pic_name"),
            whatsapp: formData.get("whatsapp"),
            password: formData.get("password"),
            password_confirmation: formData.get("confirm_password"),
        };

        try {
            const response = await api.post("/auth/register", data);
            toast.success("Registrasi Berhasil!", {
                description: response.data.message
            });
            // Reset form or redirect
            setNpsn("");
            setSchoolName("");
            setSubdomain("");
            (e.target as HTMLFormElement).reset();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            const message = error.response?.data?.message || "Terjadi kesalahan saat pendaftaran.";
            toast.error("Pendaftaran Gagal", {
                description: message
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-muted/30 p-4 md:p-8 font-sans">
            <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">

                {/* Left Side Copy */}
                <div className="order-2 lg:order-1 space-y-8 animate-in slide-in-from-left-8 duration-700 hidden lg:block">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <Shield className="w-8 h-8 text-primary" />
                            </div>
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-primary to-primary/80">
                                Mosikola
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                            Mulai Bangun Sekolah yang <span className="text-primary">Lebih Transparan</span>
                        </h1>

                        <p className="text-xl text-muted-foreground leading-relaxed max-w-md">
                            Daftarkan sekolah Anda dan berikan ketenangan kepada orang tua dengan sistem monitoring real-time dari Mosikola.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {[
                            "Absensi real-time terintegrasi",
                            "Monitoring kedisiplinan terstruktur",
                            "Dashboard pimpinan yang informatif"
                        ].map((benefit, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
                                    <Check className="w-5 h-5 text-green-600 dark:text-green-400" strokeWidth={3} />
                                </div>
                                <span className="text-foreground/80 font-medium text-lg">{benefit}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-8 border-t border-border/50">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                                        <User size={16} />
                                    </div>
                                ))}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                <span className="font-bold text-foreground">500+ Sekolah</span> telah bergabung
                            </div>
                        </div>
                    </div>
                </div>

                {/* Register Form */}
                <div className="order-1 lg:order-2">
                    <Card className="border-border/50 shadow-xl shadow-primary/5">
                        <CardContent className="p-6 md:p-8 lg:p-10">
                            <div className="mb-8 text-center lg:text-left">
                                <Link href="/" className="lg:hidden inline-flex items-center gap-2 mb-6">
                                    <div className="bg-primary/10 p-1.5 rounded-lg">
                                        <Shield className="w-5 h-5 text-primary" />
                                    </div>
                                    <span className="text-lg font-bold text-foreground">Mosikola</span>
                                </Link>
                                <h2 className="text-2xl font-bold">Daftarkan Sekolah Anda</h2>
                                <p className="text-muted-foreground mt-1">Isi data di bawah ini untuk membuat akun sekolah baru.</p>
                            </div>

                            <form className="space-y-5" onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="npsn">NPSN</Label>
                                        <div className="relative">
                                            <Shield className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="npsn"
                                                name="npsn"
                                                placeholder="Nomor Pokok Sekolah Nasional (8 digit)"
                                                className="pl-9"
                                                required
                                                maxLength={8}
                                                value={npsn}
                                                onChange={handleNpsnChange}
                                            />
                                            {isLoadingSchool && (
                                                <div className="absolute right-3 top-2.5">
                                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="school_name">Nama Sekolah</Label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="school_name"
                                                name="school_name"
                                                placeholder="Otomatis terisi dari NPSN"
                                                className={cn(
                                                    "pl-9 bg-muted/50 cursor-not-allowed",
                                                    schoolName && "font-semibold text-primary bg-primary/5 border-primary/20"
                                                )}
                                                required
                                                readOnly
                                                value={schoolName}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="subdomain">Subdomain Sekolah (Calon URL)</Label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="subdomain"
                                                name="subdomain"
                                                placeholder="nama-sekolah"
                                                className="pl-9 font-mono text-sm lowercase tracking-wider"
                                                required
                                                value={subdomain}
                                                onChange={(e) => setSubdomain(slugify(e.target.value))}
                                            />
                                            <div className="absolute right-3 top-2.5 text-[10px] font-bold text-muted-foreground/50">
                                                .mosikola.com
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">
                                            Ini akan menjadi alamat akses sekolah Anda nantinya.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="pic_name">Nama Penanggung Jawab</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input id="pic_name" name="pic_name" placeholder="Nama Lengkap" className="pl-9" required />
                                            </div>

                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input id="whatsapp" name="whatsapp" type="tel" placeholder="0812..." className="pl-9" required />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Sekolah / Admin</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input id="email" name="email" type="email" placeholder="admin@sekolah.sch.id" className="pl-9" required />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary/20"
                                        required
                                    />
                                    <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                                        Saya menyetujui <Link href="#" className="text-primary hover:underline">Syarat & Ketentuan</Link> dan <Link href="#" className="text-primary hover:underline">Kebijakan Privasi</Link> Mosikola.
                                    </label>
                                </div>

                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={isSubmitting}
                                    className="w-full font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Mendaftar...
                                        </>
                                    ) : "Daftar Gratis"}
                                </Button>

                                <p className="text-center text-sm text-muted-foreground">
                                    Sudah punya akun?{" "}
                                    <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                                        Masuk di sini
                                    </Link>
                                </p>
                            </form>

                            <div className="mt-6 pt-6 border-t border-border/50 text-center">
                                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                    <Shield className="w-3 h-3" />
                                    Data Anda aman dan tidak dibagikan kepada pihak lain.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
