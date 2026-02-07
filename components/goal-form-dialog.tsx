"use client"

import { useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { Goal, Milestone } from "@/lib/types"
import { GOAL_TEMPLATES, DEFAULT_CATEGORIES } from "@/lib/types"
import { createGoal, updateGoal } from "@/lib/goal-store"
import { Plus, X, GripVertical } from "lucide-react"

interface GoalFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editGoal?: Goal | null
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function GoalFormDialog({ open, onOpenChange, editGoal }: GoalFormDialogProps) {
  const isEdit = !!editGoal

  const [title, setTitle] = useState(editGoal?.title ?? "")
  const [description, setDescription] = useState(editGoal?.description ?? "")
  const [category, setCategory] = useState(editGoal?.category ?? "")
  const [tag, setTag] = useState(editGoal?.tag ?? "")
  const [endDate, setEndDate] = useState(
    editGoal?.endDate
      ? new Date(editGoal.endDate).toISOString().split("T")[0]
      : ""
  )
  const [template, setTemplate] = useState(editGoal?.template ?? "free")
  const [templateSections, setTemplateSections] = useState<Record<string, string>>(() => {
    if (editGoal?.template && editGoal.template !== "free") {
      try {
        return JSON.parse(editGoal.description)
      } catch {
        return {}
      }
    }
    return {}
  })
  const [milestones, setMilestones] = useState<Milestone[]>(
    editGoal?.milestones ?? []
  )
  const [newMilestone, setNewMilestone] = useState("")

  const resetForm = useCallback(() => {
    setTitle("")
    setDescription("")
    setCategory("")
    setTag("")
    setEndDate("")
    setTemplate("free")
    setTemplateSections({})
    setMilestones([])
    setNewMilestone("")
  }, [])

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value) resetForm()
      onOpenChange(value)
    },
    [onOpenChange, resetForm]
  )

  const addMilestone = () => {
    if (!newMilestone.trim()) return
    setMilestones((prev) => [
      ...prev,
      { id: generateId(), title: newMilestone.trim(), completed: false },
    ])
    setNewMilestone("")
  }

  const removeMilestone = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id))
  }

  const buildDescription = (): string => {
    if (template === "free") return description
    return JSON.stringify(templateSections)
  }

  const handleSubmit = async () => {
    if (!title.trim() || !endDate) return

    const goalData: Goal = {
      id: editGoal?.id ?? generateId(),
      title: title.trim(),
      description: buildDescription(),
      category: category || undefined,
      tag: tag || undefined,
      endDate: new Date(endDate).toISOString(),
      status: editGoal?.status ?? "not-started",
      milestones,
      template,
      createdAt: editGoal?.createdAt ?? new Date().toISOString(),
      completedAt: editGoal?.completedAt,
    }

    if (milestones.length > 0) {
      const completed = milestones.filter((m) => m.completed).length
      if (completed === milestones.length && milestones.length > 0) {
        goalData.status = "completed"
        goalData.completedAt = goalData.completedAt ?? new Date().toISOString()
      } else if (completed > 0) {
        goalData.status = "in-progress"
      }
    }

    if (isEdit) {
      await updateGoal(goalData)
    } else {
      await createGoal(goalData)
    }

    handleOpenChange(false)
  }

  const selectedTemplate = GOAL_TEMPLATES.find((t) => t.id === template)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Goal" : "Create New Goal"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update your goal details and milestones."
              : "Define your goal using a template and add milestones to track progress."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Template Selection */}
          {!isEdit && (
            <div className="grid gap-2">
              <Label className="text-sm font-medium">Template</Label>
              <div className="flex flex-wrap gap-2">
                {GOAL_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTemplate(t.id)
                      setTemplateSections({})
                      setDescription("")
                    }}
                    className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                      template === t.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-card-foreground border-border hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
              {selectedTemplate && (
                <p className="text-xs text-muted-foreground">
                  {selectedTemplate.description}
                </p>
              )}
            </div>
          )}

          {/* Title */}
          <div className="grid gap-1.5">
            <Label htmlFor="goal-title">Title</Label>
            <Input
              id="goal-title"
              placeholder="What do you want to achieve?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description / Template Sections */}
          {template === "free" ? (
            <div className="grid gap-1.5">
              <Label htmlFor="goal-desc">Description</Label>
              <Textarea
                id="goal-desc"
                placeholder="Describe your goal in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-24"
              />
            </div>
          ) : (
            selectedTemplate?.sections.map((section) => (
              <div key={section.label} className="grid gap-1.5">
                <Label>{section.label}</Label>
                <Textarea
                  placeholder={section.placeholder}
                  value={templateSections[section.label] ?? ""}
                  onChange={(e) =>
                    setTemplateSections((prev) => ({
                      ...prev,
                      [section.label]: e.target.value,
                    }))
                  }
                  className="min-h-16"
                />
              </div>
            ))
          )}

          {/* Category and Tag */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="goal-tag">Tag</Label>
              <Input
                id="goal-tag"
                placeholder="e.g., Q1, Personal"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              />
            </div>
          </div>

          {/* End Date */}
          <div className="grid gap-1.5">
            <Label htmlFor="goal-end-date">End Date</Label>
            <Input
              id="goal-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Milestones */}
          <div className="grid gap-2">
            <Label>Milestones</Label>
            {milestones.length > 0 && (
              <div className="space-y-1.5">
                {milestones.map((m, index) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary"
                  >
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground font-mono w-5">
                      {index + 1}.
                    </span>
                    <span className="text-sm flex-1 text-secondary-foreground">{m.title}</span>
                    <button
                      type="button"
                      onClick={() => removeMilestone(m.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label={`Remove milestone: ${m.title}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Add a milestone..."
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addMilestone()
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addMilestone}
                disabled={!newMilestone.trim()}
                aria-label="Add milestone"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !endDate}>
            {isEdit ? "Save Changes" : "Create Goal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
