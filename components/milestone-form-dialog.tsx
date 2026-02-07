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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Milestone, MilestoneStatus } from "@/lib/types"
import { generateId } from "@/lib/types"

interface MilestoneFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  milestone?: Milestone | null
  /** All existing milestones for this goal, for parent selection */
  existingMilestones: Milestone[]
  onSave: (milestone: Milestone) => void
}

export function MilestoneFormDialog({
  open,
  onOpenChange,
  milestone,
  existingMilestones,
  onSave,
}: MilestoneFormDialogProps) {
  const isEdit = !!milestone

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [endDate, setEndDate] = useState("")
  const [status, setStatus] = useState<MilestoneStatus>("not-started")
  const [parentMilestoneId, setParentMilestoneId] = useState<string>("none")

  useEffect(() => {
    if (open) {
      setTitle(milestone?.title ?? "")
      setDescription(milestone?.description ?? "")
      setEndDate(
        milestone?.endDate
          ? new Date(milestone.endDate).toISOString().split("T")[0]
          : ""
      )
      setStatus(milestone?.status ?? "not-started")
      setParentMilestoneId(milestone?.parentMilestoneId ?? "none")
    }
  }, [open, milestone])

  const handleSubmit = () => {
    if (!title.trim()) return

    const saved: Milestone = {
      id: milestone?.id ?? generateId(),
      title: title.trim(),
      description: description.trim() || undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      status,
      parentMilestoneId:
        parentMilestoneId !== "none" ? parentMilestoneId : undefined,
      completedAt:
        status === "completed"
          ? milestone?.completedAt ?? new Date().toISOString()
          : undefined,
    }

    onSave(saved)
    onOpenChange(false)
  }

  // Exclude current milestone from parent options to prevent circular reference
  const parentOptions = existingMilestones.filter(
    (m) => m.id !== milestone?.id
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Milestone" : "Add Milestone"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this milestone's details."
              : "Add a new milestone to track progress toward your goal."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="ms-title">Title</Label>
            <Input
              id="ms-title"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="ms-desc">Description</Label>
            <Textarea
              id="ms-desc"
              placeholder="Optional details about this milestone..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="ms-date">End Date</Label>
              <Input
                id="ms-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as MilestoneStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="dropped">Dropped</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {parentOptions.length > 0 && (
            <div className="grid gap-1.5">
              <Label>Parent Milestone</Label>
              <Select
                value={parentMilestoneId}
                onValueChange={setParentMilestoneId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (top-level)</SelectItem>
                  {parentOptions.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            {isEdit ? "Save Changes" : "Add Milestone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
