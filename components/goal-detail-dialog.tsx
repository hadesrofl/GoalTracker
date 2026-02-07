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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Goal, GoalStatus, Milestone, MilestoneStatus } from "@/lib/types"
import { GOAL_TEMPLATES, deriveGoalStatus, propagateMilestoneStatuses } from "@/lib/types"
import { updateGoal, deleteGoal, useCategories } from "@/lib/goal-store"
import { MilestoneFormDialog } from "@/components/milestone-form-dialog"
import {
  Calendar,
  Edit2,
  Trash2,
  CheckCircle2,
  Target,
  AlertCircle,
  Plus,
  Pencil,
  ChevronRight,
  Circle,
  Clock,
  XCircle,
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
  const active = goal.milestones.filter((m) => m.status !== "dropped")
  if (active.length === 0) return 0
  const completed = active.filter((m) => m.status === "completed").length
  return Math.round((completed / active.length) * 100)
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

const STATUS_LABELS: Record<MilestoneStatus, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  completed: "Completed",
  dropped: "Dropped",
}

const STATUS_ICONS: Record<MilestoneStatus, typeof Circle> = {
  "not-started": Circle,
  "in-progress": Clock,
  completed: CheckCircle2,
  dropped: XCircle,
}

const STATUS_COLORS: Record<MilestoneStatus, string> = {
  "not-started": "text-muted-foreground",
  "in-progress": "text-[hsl(var(--chart-3))]",
  completed: "text-primary",
  dropped: "text-muted-foreground opacity-50",
}

export function GoalDetailDialog({
  goal,
  open,
  onOpenChange,
  onEdit,
}: GoalDetailDialogProps) {
  const { categories } = useCategories()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [milestoneFormOpen, setMilestoneFormOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null
  )
  const [confirmDeleteMilestoneId, setConfirmDeleteMilestoneId] = useState<
    string | null
  >(null)

  if (!goal) return null

  const progress = getProgress(goal)
  const templateData = parseTemplateDescription(goal)
  const template = GOAL_TEMPLATES.find((t) => t.id === goal.template)
  const endDate = new Date(goal.endDate)
  const createdDate = new Date(goal.createdAt)

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

  // Milestone CRUD within the detail view
  const handleSaveMilestone = async (milestone: Milestone) => {
    let updatedMilestones = [...goal.milestones]
    const existingIdx = updatedMilestones.findIndex(
      (m) => m.id === milestone.id
    )
    if (existingIdx !== -1) {
      updatedMilestones[existingIdx] = milestone
    } else {
      updatedMilestones.push(milestone)
    }

    // Propagate status upward through parent chain
    updatedMilestones = propagateMilestoneStatuses(
      updatedMilestones,
      milestone.id
    )

    const newStatus = deriveGoalStatus(updatedMilestones)

    await updateGoal({
      ...goal,
      milestones: updatedMilestones,
      status: newStatus,
      completedAt:
        newStatus === "completed"
          ? goal.completedAt ?? new Date().toISOString()
          : undefined,
    })
    setEditingMilestone(null)
  }

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (confirmDeleteMilestoneId !== milestoneId) {
      setConfirmDeleteMilestoneId(milestoneId)
      return
    }
    const updatedMilestones = goal.milestones
      .filter((m) => m.id !== milestoneId)
      .map((m) =>
        m.parentMilestoneId === milestoneId
          ? { ...m, parentMilestoneId: undefined }
          : m
      )
    await updateGoal({ ...goal, milestones: updatedMilestones })
    setConfirmDeleteMilestoneId(null)
  }

  const handleQuickStatusChange = async (
    milestoneId: string,
    newStatus: MilestoneStatus
  ) => {
    let updatedMilestones = goal.milestones.map((m) =>
      m.id === milestoneId
        ? {
            ...m,
            status: newStatus,
            completedAt:
              newStatus === "completed"
                ? m.completedAt ?? new Date().toISOString()
                : undefined,
          }
        : m
    )

    // Propagate status upward through parent chain
    updatedMilestones = propagateMilestoneStatuses(
      updatedMilestones,
      milestoneId
    )

    const goalStatus = deriveGoalStatus(updatedMilestones)

    await updateGoal({
      ...goal,
      milestones: updatedMilestones,
      status: goalStatus,
      completedAt:
        goalStatus === "completed"
          ? goal.completedAt ?? new Date().toISOString()
          : undefined,
    })
  }

  // Build a tree of milestones
  const topLevel = goal.milestones.filter((m) => !m.parentMilestoneId)
  const getChildren = (parentId: string) =>
    goal.milestones.filter((m) => m.parentMilestoneId === parentId)

  const renderMilestone = (m: Milestone, depth: number = 0) => {
    const Icon = STATUS_ICONS[m.status]
    const children = getChildren(m.id)
    return (
      <div key={m.id} style={{ marginLeft: depth * 20 }}>
        <div className="flex items-start gap-3 px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors group">
          <div className="pt-0.5">
            <Icon className={`h-4 w-4 ${STATUS_COLORS[m.status]}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${
                  m.status === "completed"
                    ? "line-through text-muted-foreground"
                    : m.status === "dropped"
                      ? "line-through text-muted-foreground opacity-50"
                      : "text-card-foreground"
                }`}
              >
                {m.title}
              </span>
            </div>
            {m.description && (
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {m.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Select
                value={m.status}
                onValueChange={(v) =>
                  handleQuickStatusChange(
                    m.id,
                    v as MilestoneStatus
                  )
                }
              >
                <SelectTrigger className="h-6 w-28 text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-started">
                    Not Started
                  </SelectItem>
                  <SelectItem value="in-progress">
                    In Progress
                  </SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="dropped">Dropped</SelectItem>
                </SelectContent>
              </Select>
              {m.endDate && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(m.endDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
              {m.completedAt && m.status === "completed" && (
                <span className="text-[11px] text-muted-foreground">
                  Done{" "}
                  {new Date(m.completedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => {
                setEditingMilestone(m)
                setMilestoneFormOpen(true)
              }}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label={`Edit ${m.title}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteMilestone(m.id)}
              className={`transition-colors p-1 ${
                confirmDeleteMilestoneId === m.id
                  ? "text-destructive"
                  : "text-muted-foreground hover:text-destructive"
              }`}
              aria-label={`Delete ${m.title}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {children.map((child) => renderMilestone(child, depth + 1))}
      </div>
    )
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setConfirmDelete(false)
          setConfirmDeleteMilestoneId(null)
          onOpenChange(v)
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-xl">
                  {goal.title}
                </DialogTitle>
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
              {goal.category && (() => {
                const catObj = categories.find((c) => c.name === goal.category)
                return (
                  <Badge
                    variant="secondary"
                    style={
                      catObj
                        ? { backgroundColor: `${catObj.color}20`, color: catObj.color, borderColor: `${catObj.color}40` }
                        : undefined
                    }
                  >
                    {catObj && (
                      <span
                        className="mr-1 h-2 w-2 rounded-full inline-block"
                        style={{ backgroundColor: catObj.color }}
                      />
                    )}
                    {goal.category}
                  </Badge>
                )
              })()}
              {goal.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="bg-transparent">
                  {tag}
                </Badge>
              ))}
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
                <span className="text-sm text-muted-foreground">
                  Status:
                </span>
                <Select
                  value={goal.status}
                  onValueChange={(v) =>
                    handleStatusChange(v as GoalStatus)
                  }
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
                  <span className="text-sm font-medium text-foreground">
                    Progress
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {
                      goal.milestones.filter(
                        (m) => m.status === "completed"
                      ).length
                    }
                    /
                    {
                      goal.milestones.filter(
                        (m) => m.status !== "dropped"
                      ).length
                    }{" "}
                    milestones ({progress}%)
                  </span>
                </div>
                <Progress value={progress} className="h-2.5" />
              </div>
            )}

            {/* Description */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-foreground">
                Description
              </h4>
              {templateData && template ? (
                <div className="space-y-3">
                  {template.sections.map((section) => (
                    <div key={section.label}>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                        {section.label}
                      </p>
                      <p className="text-sm text-card-foreground leading-relaxed">
                        {templateData[section.label] ||
                          "Not specified"}
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
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-foreground">
                  Milestones
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingMilestone(null)
                    setMilestoneFormOpen(true)
                  }}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
              {goal.milestones.length > 0 ? (
                <div className="space-y-0.5">
                  {topLevel.map((m) => renderMilestone(m))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No milestones yet. Add milestones to track
                  step-by-step progress.
                </p>
              )}
            </div>
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

      <MilestoneFormDialog
        open={milestoneFormOpen}
        onOpenChange={setMilestoneFormOpen}
        milestone={editingMilestone}
        existingMilestones={goal.milestones}
        onSave={handleSaveMilestone}
      />
    </>
  )
}
