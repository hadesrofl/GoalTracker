"use client"

import { useState, useEffect } from "react"
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
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Goal, Milestone, MilestoneStatus } from "@/lib/types"
import { GOAL_TEMPLATES, generateId } from "@/lib/types"
import { createGoal, updateGoal, useCategories } from "@/lib/goal-store"
import { MilestoneFormDialog } from "@/components/milestone-form-dialog"
import { Plus, Pencil, Trash2, ChevronRight } from "lucide-react"

interface GoalFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editGoal?: Goal | null
}

const STATUS_LABELS: Record<MilestoneStatus, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  completed: "Completed",
  dropped: "Dropped",
}

const STATUS_COLORS: Record<MilestoneStatus, string> = {
  "not-started": "bg-secondary text-secondary-foreground",
  "in-progress":
    "bg-[hsl(var(--chart-3))]/10 text-[hsl(var(--chart-3))]",
  completed: "bg-primary/10 text-primary",
  dropped: "bg-muted text-muted-foreground",
}

export function GoalFormDialog({
  open,
  onOpenChange,
  editGoal,
}: GoalFormDialogProps) {
  const isEdit = !!editGoal
  const { categories } = useCategories()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [tag, setTag] = useState("")
  const [endDate, setEndDate] = useState("")
  const [template, setTemplate] = useState("free")
  const [templateSections, setTemplateSections] = useState<
    Record<string, string>
  >({})
  const [milestones, setMilestones] = useState<Milestone[]>([])

  // Milestone form state
  const [milestoneFormOpen, setMilestoneFormOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null
  )

  // Populate form fields from editGoal whenever dialog opens
  useEffect(() => {
    if (open) {
      if (editGoal) {
        setTitle(editGoal.title)
        setCategory(editGoal.category ?? "")
        setTag(editGoal.tag ?? "")
        setEndDate(
          editGoal.endDate
            ? new Date(editGoal.endDate).toISOString().split("T")[0]
            : ""
        )
        setTemplate(editGoal.template ?? "free")
        setMilestones(editGoal.milestones ?? [])

        if (editGoal.template && editGoal.template !== "free") {
          try {
            setTemplateSections(JSON.parse(editGoal.description))
          } catch {
            setTemplateSections({})
            setDescription(editGoal.description)
          }
          setDescription("")
        } else {
          setDescription(editGoal.description)
          setTemplateSections({})
        }
      } else {
        // Reset for new goal
        setTitle("")
        setDescription("")
        setCategory("")
        setTag("")
        setEndDate("")
        setTemplate("free")
        setTemplateSections({})
        setMilestones([])
      }
    }
  }, [open, editGoal])

  const handleOpenChange = (value: boolean) => {
    onOpenChange(value)
  }

  const handleSaveMilestone = (milestone: Milestone) => {
    setMilestones((prev) => {
      const existing = prev.findIndex((m) => m.id === milestone.id)
      if (existing !== -1) {
        const updated = [...prev]
        updated[existing] = milestone
        return updated
      }
      return [...prev, milestone]
    })
    setEditingMilestone(null)
  }

  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone)
    setMilestoneFormOpen(true)
  }

  const handleDeleteMilestone = (id: string) => {
    setMilestones((prev) =>
      prev
        .filter((m) => m.id !== id)
        .map((m) =>
          m.parentMilestoneId === id
            ? { ...m, parentMilestoneId: undefined }
            : m
        )
    )
  }

  const handleAddMilestone = () => {
    setEditingMilestone(null)
    setMilestoneFormOpen(true)
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

    // Auto-derive status from milestones
    if (milestones.length > 0) {
      const completed = milestones.filter(
        (m) => m.status === "completed"
      ).length
      const active = milestones.filter(
        (m) => m.status !== "dropped"
      ).length
      if (completed === active && active > 0) {
        goalData.status = "completed"
        goalData.completedAt =
          goalData.completedAt ?? new Date().toISOString()
      } else if (
        milestones.some(
          (m) =>
            m.status === "in-progress" || m.status === "completed"
        )
      ) {
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
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit Goal" : "Create New Goal"}
            </DialogTitle>
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
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
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
              <div className="flex items-center justify-between">
                <Label>Milestones</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddMilestone}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Milestone
                </Button>
              </div>
              {milestones.length > 0 ? (
                <div className="space-y-1.5">
                  {milestones.map((m, index) => {
                    const parent = m.parentMilestoneId
                      ? milestones.find(
                          (p) => p.id === m.parentMilestoneId
                        )
                      : null
                    return (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary"
                      >
                        <span className="text-xs text-muted-foreground font-mono w-5">
                          {index + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-secondary-foreground truncate">
                              {m.title}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] shrink-0 ${STATUS_COLORS[m.status]}`}
                            >
                              {STATUS_LABELS[m.status]}
                            </Badge>
                          </div>
                          {parent && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Sub of: {parent.title}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEditMilestone(m)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={`Edit milestone: ${m.title}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMilestone(m.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          aria-label={`Remove milestone: ${m.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No milestones yet. Add milestones to track step-by-step
                  progress.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || !endDate}
            >
              {isEdit ? "Save Changes" : "Create Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MilestoneFormDialog
        open={milestoneFormOpen}
        onOpenChange={setMilestoneFormOpen}
        milestone={editingMilestone}
        existingMilestones={milestones}
        onSave={handleSaveMilestone}
      />
    </>
  )
}
