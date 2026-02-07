"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { Goal } from "@/lib/types"
import { Target, CheckCircle2, Clock, TrendingUp } from "lucide-react"

interface StatsBarProps {
  goals: Goal[]
}

export function StatsBar({ goals }: StatsBarProps) {
  const total = goals.length
  const completed = goals.filter((g) => g.status === "completed").length
  const inProgress = goals.filter((g) => g.status === "in-progress").length
  const overallProgress =
    total === 0
      ? 0
      : Math.round(
          goals.reduce((acc, goal) => {
            if (goal.milestones.length === 0) {
              return acc + (goal.status === "completed" ? 100 : 0)
            }
            const active = goal.milestones.filter((m) => m.status !== "dropped")
            if (active.length === 0) return acc
            const done = active.filter((m) => m.status === "completed").length
            return acc + Math.round((done / active.length) * 100)
          }, 0) / total
        )

  const stats = [
    {
      label: "Total Goals",
      value: total,
      icon: Target,
      color: "text-[hsl(var(--chart-2))]",
      bg: "bg-[hsl(var(--chart-2))]/10",
    },
    {
      label: "Completed",
      value: completed,
      icon: CheckCircle2,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "In Progress",
      value: inProgress,
      icon: Clock,
      color: "text-[hsl(var(--chart-3))]",
      bg: "bg-[hsl(var(--chart-3))]/10",
    },
    {
      label: "Avg Progress",
      value: `${overallProgress}%`,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`p-2 rounded-lg ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
