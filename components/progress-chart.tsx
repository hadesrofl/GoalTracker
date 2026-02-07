"use client"

import { useState, useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Goal } from "@/lib/types"
import { CalendarDays, SlidersHorizontal } from "lucide-react"

interface ProgressChartProps {
  goals: Goal[]
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function getMonthLabel(key: string): string {
  const [year, month] = key.split("-")
  const date = new Date(Number(year), Number(month) - 1)
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
}

export function ProgressChart({ goals }: ProgressChartProps) {
  const currentYear = new Date().getFullYear()
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`)
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`)
  const [isCustom, setIsCustom] = useState(false)

  const chartData = useMemo(() => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    const filteredGoals = goals.filter((g) => {
      const goalEnd = new Date(g.endDate)
      const goalStart = new Date(g.createdAt)
      return goalEnd >= start && goalStart <= end
    })

    const months: Map<string, { created: number; completed: number; active: number }> = new Map()

    const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)
    while (cursor <= endMonth) {
      months.set(getMonthKey(cursor), { created: 0, completed: 0, active: 0 })
      cursor.setMonth(cursor.getMonth() + 1)
    }

    for (const goal of filteredGoals) {
      const createdKey = getMonthKey(new Date(goal.createdAt))
      if (months.has(createdKey)) {
        const entry = months.get(createdKey)!
        entry.created++
      }

      if (goal.status === "completed" && goal.completedAt) {
        const completedKey = getMonthKey(new Date(goal.completedAt))
        if (months.has(completedKey)) {
          const entry = months.get(completedKey)!
          entry.completed++
        }
      }

      for (const [key] of months) {
        const [y, m] = key.split("-").map(Number)
        const monthEnd = new Date(y, m, 0)
        const goalCreated = new Date(goal.createdAt)
        const goalEnd = new Date(goal.endDate)

        if (goalCreated <= monthEnd && goalEnd >= new Date(y, m - 1, 1)) {
          if (goal.status !== "completed" && goal.status !== "abandoned") {
            const entry = months.get(key)!
            entry.active++
          }
        }
      }
    }

    return Array.from(months.entries()).map(([key, value]) => ({
      month: getMonthLabel(key),
      Created: value.created,
      Completed: value.completed,
      Active: value.active,
    }))
  }, [goals, startDate, endDate])

  const setCurrentYear = () => {
    setStartDate(`${currentYear}-01-01`)
    setEndDate(`${currentYear}-12-31`)
    setIsCustom(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold text-card-foreground">Goal Progress Overview</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant={!isCustom ? "default" : "outline"}
            size="sm"
            onClick={setCurrentYear}
            className="text-xs"
          >
            <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
            {currentYear}
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={isCustom ? "default" : "outline"}
                size="sm"
                className="text-xs"
              >
                <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                Custom
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="chart-start" className="text-xs">
                    Start Date
                  </Label>
                  <Input
                    id="chart-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value)
                      setIsCustom(true)
                    }}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="chart-end" className="text-xs">
                    End Date
                  </Label>
                  <Input
                    id="chart-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value)
                      setIsCustom(true)
                    }}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            No goal data for this time range
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    color: "hsl(var(--popover-foreground))",
                    fontSize: 12,
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}
                />
                <Bar
                  dataKey="Created"
                  fill="hsl(var(--chart-2))"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Completed"
                  fill="hsl(var(--chart-1))"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Active"
                  fill="hsl(var(--chart-3))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
