"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface GrowthData {
    name: string;
    schools: number;
}

interface GrowthChartProps {
    data: GrowthData[];
}

export function GrowthChart({ data }: GrowthChartProps) {
    return (
        <Card className="h-full w-full">
            <CardHeader>
                <CardTitle>Pertumbuhan Sekolah (6 Bulan)</CardTitle>
                <CardDescription>
                    Jumlah sekolah baru yang bergabung
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 10,
                            left: -20,
                            bottom: 0,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            dx={-10}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#1F2937', fontWeight: 500 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="schools"
                            name="Sekolah Baru"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.2}
                            strokeWidth={3}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
