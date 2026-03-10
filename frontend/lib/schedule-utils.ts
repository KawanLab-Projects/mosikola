/**
 * schedule-utils.ts
 * Utilities for working with shortened-period days and schedule time overrides.
 */

export type ShortenedPeriodDay = {
    date: string          // "yyyy-MM-dd"
    label: string         // e.g. "Ramadan"
    duration_minutes: number
}

/**
 * Parse the raw JSON string from settings.schedule.shortened_period_days
 * into a typed array. Returns [] if the string is empty or invalid.
 */
export function parseShortenedDays(raw: string | undefined): ShortenedPeriodDay[] {
    if (!raw) return []
    try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed
    } catch { /* ignore */ }
    return []
}

/**
 * Check if a given date (yyyy-MM-dd) has a shortened period override.
 */
export function getShortenedDay(
    days: ShortenedPeriodDay[],
    dateStr: string
): ShortenedPeriodDay | undefined {
    return days.find(d => d.date === dateStr)
}

/**
 * Given a schedule's base start_time ("HH:mm") and period number,
 * compute the adjusted start/end times when period duration changes.
 *
 * How it works:
 * 1. We know `baseStartTime` is the time for period 1.
 * 2. Each period spans `originalDuration` minutes.
 * 3. For a `periodStart` (1-indexed), we compute the offset from period 1.
 * 4. We recalculate start = baseStart + (periodStart - 1) * newDuration
 *    and   end   = start + (periodEnd - periodStart + 1) * newDuration
 *
 * @param period1StartTime  "HH:mm" — start time stored on the period-1 schedule row
 * @param periodStart       The 1-indexed period number this schedule starts at
 * @param periodEnd         The 1-indexed period number this schedule ends at
 * @param originalDurationMinutes  Normal period length (e.g. 45)
 * @param newDurationMinutes       Shortened period length (e.g. 30)
 */
export function computeAdjustedTimes(
    period1StartTime: string,
    periodStart: number,
    periodEnd: number,
    originalDurationMinutes: number,
    newDurationMinutes: number
): { start_time: string; end_time: string } {
    const [h, m] = period1StartTime.split(":").map(Number)
    const base = h * 60 + m

    const adjStart = base + (periodStart - 1) * newDurationMinutes
    const adjEnd = adjStart + (periodEnd - periodStart + 1) * newDurationMinutes

    return {
        start_time: minutesToHHMM(adjStart),
        end_time: minutesToHHMM(adjEnd),
    }
}

function minutesToHHMM(totalMinutes: number): string {
    const hh = Math.floor(totalMinutes / 60).toString().padStart(2, "0")
    const mm = (totalMinutes % 60).toString().padStart(2, "0")
    return `${hh}:${mm}`
}

/**
 * Interface representing the minimum required fields to merge schedules
 */
export interface MergeableSchedule {
    day_of_week: number
    period_start: number
    period_end: number
    end_time: string
    classroom_id?: number
    teacher_id?: number
    subject_id?: number
    classroom?: { id?: number, name?: string }
    teacher?: { id?: number, name?: string }
    subject?: { id?: number, name?: string }
}

/**
 * Merges consecutive schedule items of the same subject, teacher, and classroom into a single item.
 */
export function mergeConsecutiveSchedules<T extends MergeableSchedule>(data: T[]): T[] {
    const merged: T[] = []

    // Group by day, classroom, teacher, subject
    const groups: Record<string, T[]> = {}
    for (const s of data) {
        const cId = s.classroom?.id ?? s.classroom_id ?? s.classroom?.name ?? 'c'
        const tId = s.teacher?.id ?? s.teacher_id ?? s.teacher?.name ?? 't'
        const subjId = s.subject?.id ?? s.subject_id ?? s.subject?.name ?? 's'
        const key = `${s.day_of_week}_${cId}_${tId}_${subjId}`

        if (!groups[key]) groups[key] = []
        groups[key].push(s)
    }

    for (const key in groups) {
        const sorted = groups[key].sort((a, b) => a.period_start - b.period_start)
        let current: T | null = null

        for (const s of sorted) {
            if (!current) {
                current = { ...s }
            } else {
                // Check if consecutive
                if (Number(current.period_end) + 1 === Number(s.period_start)) {
                    current.period_end = Number(s.period_end)
                    current.end_time = s.end_time
                } else {
                    merged.push(current)
                    current = { ...s }
                }
            }
        }
        if (current) merged.push(current)
    }
    return merged
}
