"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Goal, GoalStatus } from "@/lib/types"
import { GOAL_TEMPLATES } from "@/lib/types"
import { updateGoal, deleteGoal } from "@/lib/goal-store"
import {
  Calendar,
  Edit2,
  Trash2,
  CheckCircle2,
  Target,
  AlertCircle,
} from "lucide-react"

interface GoalDetailDialogProps {
  goal: Goal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (goal: Goal) => void
}

function getProgress(goal: Goal): number {
  if (goal.milestones.length === 0) {
    return goal.status === "completed" ? 100 : 0
  }
  const completed = goal.milestones.filter((m) => m.completed).length
  return Math.round((completed / goal.milestones.length) * 100)
}

function parseTemplateDescription(
  goal: Goal
): Record<string, string> | null {
  if (!goal.template || goal.template === "free") return null
  try {
    return JSON.parse(goal.description)
  } catch {
    return null
  }
}

export function GoalDetailDialog({
  goal,
  open,
  onOpenChange,
  onEdit,
}: GoalDetailDialogProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!goal) return null

  const progress = getProgress(goal)
  const templateData = parseTemplateDescription(goal)
  const template = GOAL_TEMPLATES.find((t) => t.id === goal.template)
  const endDate = new Date(goal.endDate)
  const createdDate = new Date(goal.createdAt)

  const handleMilestoneToggle = async (milestoneId: string, checked: boolean) => {
    const updatedMilestones = goal.milestones.map((m) =>
      m.id === milestoneId
        ? {
            ...m,
            completed: checked,
            completedAt: checked ? new Date().toISOString() : undefined,
          }
        : m
    )

    const completedCount = updatedMilestones.filter((m) => m.completed).length
    let newStatus: GoalStatus = goal.status
    if (completedCount === updatedMilestones.length && updatedMilestones.length > 0) {
      newStatus = "completed"
    } else if (completedCount > 0) {
      newStatus = "in-progress"
    } else {
      newStatus = "not-started"
    }

    await updateGoal({
      ...goal,
      milestones: updatedMilestones,
      status: newStatus,
      completedAt:
        newStatus === "completed"
          ? goal.completedAt ?? new Date().toISOString()
          : undefined,
    })
  }

  const handleStatusChange = async (status: GoalStatus) => {
    await updateGoal({
      ...goal,
      status,
      completedAt:
        status === "completed"
          ? goal.completedAt ?? new Date().toISOString()
          : undefined,
    })
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    await deleteGoal(goal.id)
    setConfirmDelete(false)
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setConfirmDelete(false)
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl">{goal.title}</DialogTitle>
              <DialogDescription className="mt-1">
                Created{" "}
                {createdDate.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </DialogDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {goal.category && (
              <Badge variant="secondary">{goal.category}</Badge>
            )}
            {goal.tag && (
              <Badge variant="outline" className="bg-transparent">{goal.tag}</Badge>
            )}
            {goal.template && goal.template !== "free" && (
              <Badge
                variant="outline"
                className="bg-accent text-accent-foreground border-accent"
              >
                {goal.template.toUpperCase()}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          {/* Status & Date */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Select
                value={goal.status}
                onValueChange={(v) => handleStatusChange(v as GoalStatus)}
              >
                <SelectTrigger className="w-40 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-started">
                    <span className="flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5" />
                      Not Started
                    </span>
                  </SelectItem>
                  <SelectItem value="in-progress">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      In Progress
                    </span>
                  </SelectItem>
                  <SelectItem value="completed">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Completed
                    </span>
                  </SelectItem>
                  <SelectItem value="abandoned">
                    <span className="flex items-center gap-1.5">
                      <Trash2 className="h-3.5 w-3.5" />
                      Abandoned
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Due{" "}
              {endDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>

          {/* Progress */}
          {goal.milestones.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {goal.milestones.filter((m) => m.completed).length}/
                  {goal.milestones.length} milestones ({progress}%)
                </span>
              </div>
              <Progress value={progress} className="h-2.5" />
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-foreground">Description</h4>
            {templateData && template ? (
              <div className="space-y-3">
                {template.sections.map((section) => (
                  <div key={section.label}>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                      {section.label}
                    </p>
                    <p className="text-sm text-card-foreground leading-relaxed">
                      {templateData[section.label] || "Not specified"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-card-foreground leading-relaxed whitespace-pre-wrap">
                {goal.description || "No description provided."}
              </p>
            )}
          </div>

          {/* Milestones */}
          {goal.milestones.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-foreground">Milestones</h4>
              <div className="space-y-1">
                {goal.milestones.map((milestone) => (
                  <label
                    key={milestone.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <Checkbox
                      checked={milestone.completed}
                      onCheckedChange={(checked) =>
                        handleMilestoneToggle(
                          milestone.id,
                          checked === true
                        )
                      }
                    />
                    <span
                      className={`text-sm flex-1 ${
                        milestone.completed
                          ? "line-through text-muted-foreground"
                          : "text-card-foreground"
                      }`}
                    >
                      {milestone.title}
                    </span>
                    {milestone.completed && milestone.completedAt && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(milestone.completedAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between gap-2">
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              {confirmDelete ? "Confirm Delete" : "Delete"}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onEdit(goal)
                onOpenChange(false)
              }}
            >
              <Edit2 className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
