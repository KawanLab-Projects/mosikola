"use client"


import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import ViolationTypesTab from "./ViolationTypesTab"
import StudentViolationsTab from "./StudentViolationsTab"
import PositiveBehaviorsTab from "./PositiveBehaviorsTab"
import { ShieldAlert, Star } from "lucide-react"

export default function DisiplinPage() {
    return (
        <div className="flex-1 space-y-6 p-8">
            <div className="flex flex-col space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Manajemen Disiplin</h2>
                <p className="text-muted-foreground">
                    Kelola jenis pelanggaran sekolah dan catat riwayat pelanggaran siswa.
                </p>
            </div>


            <Tabs defaultValue="pelanggaran" className="w-full">
                <div className="mb-4">
                    <TabsList className="bg-slate-100 p-1 rounded-lg w-full">
                        <TabsTrigger value="pelanggaran"><ShieldAlert className="text-red-500" /> Catatan Pelanggaran</TabsTrigger>
                        <TabsTrigger value="perilaku-positif"><Star className="text-green-500" /> Catatan Perilaku Positif</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="pelanggaran">
                    <Tabs defaultValue="violation-types" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                            <TabsTrigger value="violation-types">Jenis Pelanggaran</TabsTrigger>
                            <TabsTrigger value="violation-records">Catatan Pelanggaran</TabsTrigger>
                        </TabsList>

                        <TabsContent value="violation-types" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Jenis Pelanggaran</CardTitle>
                                    <CardDescription>
                                        Kelola daftar pelanggaran beserta poin sanksi yang berlaku di sekolah ini.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ViolationTypesTab />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="violation-records" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Riwayat Pelanggaran Siswa</CardTitle>
                                    <CardDescription>
                                        Lihat dan catat pelanggaran yang dilakukan oleh siswa.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <StudentViolationsTab />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </TabsContent>
                <TabsContent value="perilaku-positif">
                    <Tabs defaultValue="positive-behavior-types" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                            <TabsTrigger value="positive-behavior-types">Kegiatan Positif</TabsTrigger>
                            <TabsTrigger value="positive-behavior-records">Catatan Kegiatan Positif</TabsTrigger>
                        </TabsList>

                        <TabsContent value="positive-behavior-types" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Kegiatan Positif</CardTitle>
                                    <CardDescription>
                                        Kelola daftar kegiatan positif beserta poin reward yang berlaku di sekolah ini.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <PositiveBehaviorsTab />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="positive-behavior-records" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Riwayat Kegiatan Positif Siswa</CardTitle>
                                    <CardDescription>
                                        Lihat dan catat kegiatan positif yang dilakukan oleh siswa.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <StudentViolationsTab />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </TabsContent>
            </Tabs>
        </div>
    )
}
