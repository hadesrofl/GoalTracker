"use client"

import { useState, useEffect, type KeyboardEvent } from "react"
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
import { GOAL_TEMPLATES, generateId, deriveGoalStatus } from "@/lib/types"
import { createGoal, updateGoal, useCategories } from "@/lib/goal-store"
import { MilestoneFormDialog } from "@/components/milestone-form-dialog"
import {
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  X,
  Circle,
  CheckCircle2,
} from "lucide-react"

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
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
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
        setTags(editGoal.tags ?? [])
        setTagInput("")
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
        setTitle("")
        setDescription("")
        setCategory("")
        setTags([])
        setTagInput("")
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

  // Tag input handlers
  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const trimmed = tagInput.trim()
      if (trimmed && !tags.includes(trimmed)) {
        setTags([...tags, trimmed])
      }
      setTagInput("")
    }
    if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags(tags.slice(0, -1))
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
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

  const handleToggleMilestoneComplete = (id: string) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m
        const newStatus: MilestoneStatus =
          m.status === "completed" ? "not-started" : "completed"
        return {
          ...m,
          status: newStatus,
          completedAt:
            newStatus === "completed"
              ? new Date().toISOString()
              : undefined,
        }
      })
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

    const derivedStatus = deriveGoalStatus(milestones)

    const goalData: Goal = {
      id: editGoal?.id ?? generateId(),
      title: title.trim(),
      description: buildDescription(),
      category: category || undefined,
      tags,
      endDate: new Date(endDate).toISOString(),
      status:
        milestones.length > 0
          ? derivedStatus
          : editGoal?.status ?? "not-started",
      milestones,
      template,
      createdAt: editGoal?.createdAt ?? new Date().toISOString(),
      completedAt:
        derivedStatus === "completed"
          ? editGoal?.completedAt ?? new Date().toISOString()
          : undefined,
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

            {/* Category and Tags */}
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
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="goal-tag">Tags</Label>
                <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 min-h-9">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs gap-1 pr-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <Input
                    id="goal-tag"
                    placeholder={tags.length === 0 ? "Type and press Enter" : "Add more..."}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="flex-1 min-w-20 border-0 p-0 h-6 focus-visible:ring-0 shadow-none"
                  />
                </div>
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
                  {milestones.map((m) => {
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
                        <button
                          type="button"
                          onClick={() => handleToggleMilestoneComplete(m.id)}
                          className="shrink-0 transition-colors"
                          aria-label={
                            m.status === "completed"
                              ? `Mark "${m.title}" incomplete`
                              : `Mark "${m.title}" complete`
                          }
                        >
                          {m.status === "completed" ? (
                            <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
                          ) : (
                            <Circle className="h-4.5 w-4.5 text-muted-foreground hover:text-primary" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm text-secondary-foreground truncate ${
                                m.status === "completed" ? "line-through text-muted-foreground" : ""
                              }`}
                            >
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
