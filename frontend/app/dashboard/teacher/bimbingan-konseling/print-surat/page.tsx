"use client"

import React, { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Suspense } from "react"

interface ViolationItem {
    id: number;
    date: string;
    violation?: {
        name: string;
        points: number;
    };
}

interface StudentPrintData {
    id: number;
    public_id: string;
    name: string;
    nisn: string;
    classroom?: {
        name: string;
    };
    total_points: number;
    tenant?: {
        name: string;
        logo: string;
    };
    student_violations?: ViolationItem[];
}

interface TenantSettings {
    school?: {
        name?: string;
        school_address?: string;
        principal_name?: string;
        principal_nip?: string;
        school_logo_url?: string;
    };
}

function PrintSuratPeringatanContent() {
    const searchParams = useSearchParams()
    const studentId = searchParams.get("student_id")
    const type = searchParams.get("type") as 'sp1' | 'sp2' | 'parent_call' | 'suspension' | null
    const customNumber = searchParams.get("number")

    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<StudentPrintData | null>(null)
    const [settings, setSettings] = useState<TenantSettings | null>(null)

    useEffect(() => {
        if (!studentId || !type) return

        const fetchData = async () => {
            try {
                // Fetch student data with violations
                const studentRes = await api.get(`/students/${studentId}`)
                const meRes = await api.get(`/auth/me`)

                setData(studentRes.data.data)
                setSettings(meRes.data.tenant_settings)
            } catch (error) {
                console.error("Failed to fetch data for printing", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [studentId, type])

    useEffect(() => {
        if (!loading && data && settings) {
            // Give browser time to render DOM before triggering print dialog
            const timer = setTimeout(() => {
                window.print()
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [loading, data, settings])

    if (!studentId || !type) {
        return <div className="p-8 text-center text-red-500 font-bold">Parameter tidak lengkap.</div>
    }

    if (loading) {
        return <div className="p-8 text-center bg-white min-h-screen">Menyiapkan dokumen...</div>
    }

    if (!data) {
        return <div className="p-8 text-center text-red-500 font-bold bg-white min-h-screen">Data siswa tidak ditemukan.</div>
    }

    const schoolSettings = settings?.school
    const tenantData = data.tenant // data is already checked for null

    // School name from tenant table (Mosikola standard), fallback to settings
    const schoolName = tenantData?.name || schoolSettings?.name || "[NAMA SEKOLAH BELUM DIATUR]"
    const schoolAddress = schoolSettings?.school_address || "[ALAMAT SEKOLAH BELUM DIATUR]"
    const principalName = schoolSettings?.principal_name || "[NAMA KEPALA SEKOLAH]"
    const principalNip = schoolSettings?.principal_nip || "[-]"

    // Logo always from tenant settings 'school' group, fallback to tenant.logo
    const logoUrl = schoolSettings?.school_logo_url || tenantData?.logo

    const getLetterTitleAndNumber = () => {
        const defaultNumber = `0${Math.floor(Math.random() * 99) + 1}/BK/${format(new Date(), 'MM/yyyy')}`
        const finalNumber = customNumber || defaultNumber

        switch (type) {
            case 'sp1': return { title: "SURAT PERINGATAN I (PERTAMA)", number: finalNumber }
            case 'sp2': return { title: "SURAT PERINGATAN II (KEDUA)", number: finalNumber }
            case 'parent_call': return { title: "SURAT PANGGILAN ORANG TUA/WALI", number: finalNumber }
            case 'suspension': return { title: "SURAT PEMBERITAHUAN SKORSING", number: finalNumber }
            default: return { title: "SURAT KETERANGAN", number: finalNumber }
        }
    }

    const docMeta = getLetterTitleAndNumber()
    const isSuspension = type === 'suspension'
    const isParentCall = type === 'parent_call'

    // Sort violations to get the latest 5
    const recentViolations = [...(data.student_violations || [])]
        .sort((a: ViolationItem, b: ViolationItem) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 15mm 20mm; }
                    body { margin: 0; padding: 0; background: white; }
                    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}} />
            <div className="bg-white min-h-screen text-black p-8 flex justify-center print:absolute print:left-0 print:top-0 print:w-full print:bg-white print:p-0 print:overflow-visible">
                {/* The actual A4 page container */}
                <div className="w-full max-w-[210mm] min-h-[297mm] bg-white print:shadow-none shadow-lg print:m-0 m-4 px-[20mm] py-[25mm] print:px-0 print:py-0 text-base leading-relaxed">

                    {/* School Letterhead (KOP SURAT) */}
                    <div className="border-b-4 border-black pb-4 mb-6 flex items-center">
                        {logoUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={logoUrl.startsWith('http') ? logoUrl : `${process.env.NEXT_PUBLIC_ASSET_URL}/storage/${logoUrl}`}
                                alt="Logo Sekolah"
                                className="w-24 h-24 object-contain mr-6"
                            />
                        ) : (
                            <div className="w-20 h-20 bg-gray-200 border border-black flex items-center justify-center font-bold mr-6">LOGO</div>
                        )}
                        <div className="text-center flex-1">
                            <h1 className="text-2xl font-extrabold uppercase tracking-wide">{schoolName}</h1>
                            <p className="text-sm mt-1">{schoolAddress}</p>
                        </div>
                        <div className="w-24"></div> {/* Spacer to keep text centered */}
                    </div>

                    {/* Letter Meta */}
                    <div className="flex justify-between mb-8 text-sm">
                        <div>
                            <table>
                                <tbody>
                                    <tr><td className="w-20">Nomor</td><td>: {docMeta.number}</td></tr>
                                    <tr><td>Sifat</td><td>: Penting & Rahasia</td></tr>
                                    <tr><td>Lampiran</td><td>: -</td></tr>
                                    <tr><td>Hal</td><td className="font-bold">: {docMeta.title}</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="text-right">
                            <p>{schoolName ? schoolName.split(" ")[0] : "Kota"}, {format(new Date(), 'dd MMMM yyyy', { locale: id })}</p>
                        </div>
                    </div>

                    {/* Receiver Info */}
                    <div className="mb-6">
                        <p>Kepada Yth.,</p>
                        <p className="font-bold">Bapak/Ibu Orang Tua / Wali dari Siswa/i:</p>
                        <p>{data.name}</p>
                        <p>Di Tempat</p>
                    </div>

                    {/* Opening */}
                    <div className="mb-4 text-justify">
                        <p>Dengan hormat,</p>
                        <p className="indent-8 mt-2">
                            Puji syukur kita panjatkan kehadirat Tuhan Yang Maha Esa. Melalui surat ini, kami memberitahukan bahwa berdasarkan catatan bagian Bimbingan Konseling (BK) dan Kedisiplinan Sekolah, putra/putri Bapak/Ibu:
                        </p>
                    </div>

                    {/* Student Details */}
                    <div className="mb-6 pl-8">
                        <table>
                            <tbody>
                                <tr><td className="w-32 py-1">Nama Lengkap</td><td className="w-4">:</td><td className="font-bold">{data.name}</td></tr>
                                <tr><td className="py-1">NISN</td><td>:</td><td>{data.nisn || "-"}</td></tr>
                                <tr><td className="py-1">Kelas</td><td>:</td><td>{data.classroom?.name || "-"}</td></tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Body Content based on Type */}
                    <div className="mb-6 text-justify">
                        <p className="indent-8">
                            Telah melakukan berbagai pelanggaran tata tertib sekolah yang terakumulasi mencapai
                            <span className="font-bold"> {data.total_points} poin pelanggaran</span>.
                        </p>

                        {isSuspension && (
                            <p className="indent-8 mt-2 font-bold text-red-700 print:text-black">
                                Mengingat poin pelanggaran tersebut telah mencapai ambang batas maksimal, maka pihak sekolah memutuskan untuk memberikan sanksi SKORSING kepada siswa yang bersangkutan terhitung mulai besok selama 3 hari efektif kerja.
                            </p>
                        )}

                        {isParentCall && !isSuspension && (
                            <p className="indent-8 mt-2">
                                Sehubungan dengan hal tersebut, kami sangat mengharapkan kehadiran Bapak/Ibu di sekolah untuk membicarakan penyelesaian masalah ini pada waktu yang akan ditentukan oleh wali kelas atau guru BK.
                            </p>
                        )}

                        {!isParentCall && !isSuspension && (
                            <p className="indent-8 mt-2">
                                Maka melalui pesan ini, pihak sekolah mengeluarkan <span className="font-bold">{docMeta.title}</span> sebagai bentuk pembinaan. Apabila di kemudian hari siswa masih melakukan pelanggaran tata tertib yang berlaku, maka pihak sekolah akan menindak dengan sanksi yang lebih berat sesuai regulasi sekolah.
                            </p>
                        )}
                    </div>

                    {/* Recent Violations Table inside the letter */}
                    {recentViolations.length > 0 && (
                        <div className="mb-8">
                            <p className="text-sm font-medium mb-2">*Sebagai catatan tambahan, 5 pelanggaran terakhir siswa:</p>
                            <table className="w-full text-sm border-collapse border border-black">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-black px-2 py-1 text-left w-24">Tanggal</th>
                                        <th className="border border-black px-2 py-1 text-left">Bentuk Pelanggaran</th>
                                        <th className="border border-black px-2 py-1 text-center w-16">Poin</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentViolations.map((v: ViolationItem) => (
                                        <tr key={v.id}>
                                            <td className="border border-black px-2 py-1">{format(new Date(v.date), 'dd/MM/yyyy')}</td>
                                            <td className="border border-black px-2 py-1">{v.violation?.name || "-"}</td>
                                            <td className="border border-black px-2 py-1 text-center">{v.violation?.points || 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Closing & Signatures Wrapper to keep them together */}
                    <div className="break-inside-avoid">
                        {/* Closing */}
                        <div className="mb-12 text-justify">
                            <p className="indent-8">
                                Demikian surat ini kami sampaikan. Kami sangat menghargai kerja sama Bapak/Ibu dalam mendidik putra-putri kita agar menjadi pribadi yang lebih baik.
                            </p>
                        </div>

                        {/* Signatures */}
                        <div className="flex justify-between items-end mt-24">
                            <div className="text-center w-64">
                                <p className="mb-24">Mengetahui,</p>
                                <p className="font-bold underline">Orang Tua / Wali Siswa</p>
                                <p className="text-sm">(......................................)</p>
                            </div>
                            <div className="text-center w-64">
                                <p className="mb-24">Kepala Sekolah,</p>
                                <p className="font-bold underline">{principalName}</p>
                                <p className="text-sm">NIP. {principalNip}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 text-xs text-center text-gray-400 print:text-black italic">
                        <p>Dokumen ini dicetak secara otomatis (Automated Document) melalui sistem Mosikola pada {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</p>
                    </div>
                </div>

                {/* Print Instruction Badge (Hidden when printing) */}
                <div className="fixed top-4 right-4 print:hidden bg-amber-100 text-amber-800 px-4 py-2 rounded-lg shadow-lg border border-amber-300 font-medium z-50 animate-bounce">
                    Tekan Ctrl+P (atau Cmd+P di Mac) jika dialog print tidak muncul.
                </div>
            </div>
        </>
    )
}

export default function PrintSuratPeringatan() {
    return (
        <Suspense fallback={<div className="p-8 text-center bg-white min-h-screen">Menyiapkan dokumen...</div>}>
            <PrintSuratPeringatanContent />
        </Suspense>
    )
}
