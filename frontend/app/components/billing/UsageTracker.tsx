"use client"

import { Progress } from "@/components/ui/progress"
import { Users, GraduationCap, Infinity } from "lucide-react"

type Plan = {
    id: number
    name: string
    student_limit: number
    teacher_limit: number
}

type Usage = {
    students: number
    teachers: number
}

interface UsageTrackerProps {
    plan: Plan
    usage: Usage
}

export function UsageTracker({ plan, usage }: UsageTrackerProps) {
    const studentLimitText = plan.student_limit === 0 ? "Unlimited" : plan.student_limit
    const teacherLimitText = plan.teacher_limit === 0 ? "Unlimited" : plan.teacher_limit

    const studentPercentage = plan.student_limit === 0 ? 0 : Math.min(100, (usage.students / plan.student_limit) * 100)
    const teacherPercentage = plan.teacher_limit === 0 ? 0 : Math.min(100, (usage.teachers / plan.teacher_limit) * 100)

    // Warnings if close to limit
    const studentWarning = plan.student_limit > 0 && studentPercentage >= 90
    const teacherWarning = plan.teacher_limit > 0 && teacherPercentage >= 90

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card border border-border rounded-xl p-6 shadow-sm">
            {/* Student Usage */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Kuota Siswa</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold">{usage.students}</span>
                                <span className="text-sm text-muted-foreground">/ {studentLimitText}</span>
                            </div>
                        </div>
                    </div>
                    {plan.student_limit === 0 && (
                        <Infinity className="w-6 h-6 text-muted-foreground/50" />
                    )}
                </div>

                {plan.student_limit > 0 && (
                    <div className="space-y-1.5">
                        <Progress
                            value={studentPercentage}
                            className={`h-2 ${studentWarning ? '[&>div]:bg-red-500' : '[&>div]:bg-blue-500'}`}
                        />
                        {studentWarning && (
                            <p className="text-xs text-red-500 font-medium">Hampir mencapai batas kuota siswa</p>
                        )}
                    </div>
                )}
            </div>

            {/* Teacher Usage */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Kuota Guru</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold">{usage.teachers}</span>
                                <span className="text-sm text-muted-foreground">/ {teacherLimitText}</span>
                            </div>
                        </div>
                    </div>
                    {plan.teacher_limit === 0 && (
                        <Infinity className="w-6 h-6 text-muted-foreground/50" />
                    )}
                </div>

                {plan.teacher_limit > 0 && (
                    <div className="space-y-1.5">
                        <Progress
                            value={teacherPercentage}
                            className={`h-2 ${teacherWarning ? '[&>div]:bg-red-500' : '[&>div]:bg-purple-500'}`}
                        />
                        {teacherWarning && (
                            <p className="text-xs text-red-500 font-medium">Hampir mencapai batas kuota guru</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
