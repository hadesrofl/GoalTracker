"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Goal, Category, GoalStatus } from "@/lib/types"
import { Calendar, Target, CheckCircle2, AlertCircle, Clock, Ban } from "lucide-react"
import { cn } from "@/lib/utils"

interface GoalCardProps {
  goal: Goal
  categories: Category[]
  onClick: (goal: Goal) => void
}

function getProgress(goal: Goal): number {
  if (goal.milestones.length === 0) {
    return goal.status === "completed" ? 100 : 0
  }
  const active = goal.milestones.filter((m) => m.status !== "dropped")
  if (active.length === 0) return 0
  const completed = active.filter((m) => m.status === "completed").length
  return Math.round((completed / active.length) * 100)
}

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate)
  const now = new Date()
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

const STATUS_CONFIG: Record<GoalStatus, { icon: typeof Target; label: string; className: string }> = {
  "not-started": {
    icon: Target,
    label: "Not Started",
    className: "bg-secondary text-secondary-foreground border-secondary",
  },
  "in-progress": {
    icon: Clock,
    label: "In Progress",
    className: "bg-[hsl(var(--chart-3))]/10 text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3))]/20",
  },
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  abandoned: {
    icon: Ban,
    label: "Abandoned",
    className: "bg-muted text-muted-foreground border-muted",
  },
}

function getUrgencyBadge(goal: Goal) {
  if (goal.status === "completed" || goal.status === "abandoned") return null
  const daysLeft = getDaysRemaining(goal.endDate)
  if (daysLeft < 0) {
    return {
      icon: AlertCircle,
      label: "Overdue",
      className: "bg-destructive/10 text-destructive border-destructive/20",
    }
  }
  if (daysLeft <= 7) {
    return {
      icon: Clock,
      label: `${daysLeft}d left`,
      className: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/20",
    }
  }
  return null
}

export function GoalCard({ goal, categories, onClick }: GoalCardProps) {
  const progress = getProgress(goal)
  const statusConfig = STATUS_CONFIG[goal.status]
  const StatusIcon = statusConfig.icon
  const urgency = getUrgencyBadge(goal)
  const UrgencyIcon = urgency?.icon
  const endDate = new Date(goal.endDate)
  const categoryObj = goal.category
    ? categories.find((c) => c.name === goal.category)
    : null

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 border",
        goal.status === "completed" && "border-primary/30",
        goal.status === "abandoned" && "opacity-60"
      )}
      onClick={() => onClick(goal)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick(goal)
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-tight text-card-foreground line-clamp-2 text-pretty">
            {goal.title}
          </h3>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge
              variant="outline"
              className={cn("text-xs", statusConfig.className)}
            >
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusConfig.label}
            </Badge>
            {urgency && UrgencyIcon && (
              <Badge
                variant="outline"
                className={cn("text-xs", urgency.className)}
              >
                <UrgencyIcon className="mr-1 h-3 w-3" />
                {urgency.label}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {goal.category && (
            <Badge
              variant="secondary"
              className="text-xs"
              style={
                categoryObj
                  ? { backgroundColor: `${categoryObj.color}20`, color: categoryObj.color, borderColor: `${categoryObj.color}40` }
                  : undefined
              }
            >
              {categoryObj && (
                <span
                  className="mr-1 h-2 w-2 rounded-full inline-block"
                  style={{ backgroundColor: categoryObj.color }}
                />
              )}
              {goal.category}
            </Badge>
          )}
          {goal.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs bg-transparent">
              {tag}
            </Badge>
          ))}
          {goal.template && goal.template !== "free" && (
            <Badge variant="outline" className="text-xs bg-accent text-accent-foreground border-accent">
              {goal.template.toUpperCase()}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {goal.milestones.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">
                {goal.milestones.filter((m) => m.status === "completed").length} of{" "}
                {goal.milestones.filter((m) => m.status !== "dropped").length} milestones
              </span>
              <span className="text-xs font-medium text-card-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {endDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
