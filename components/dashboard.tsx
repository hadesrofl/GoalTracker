"use client"

import { useState, useMemo } from "react"
import { useGoals } from "@/lib/goal-store"
import { GoalCard } from "@/components/goal-card"
import { ProgressChart } from "@/components/progress-chart"
import { GoalFormDialog } from "@/components/goal-form-dialog"
import { GoalDetailDialog } from "@/components/goal-detail-dialog"
import { ImportExport } from "@/components/import-export"
import { StatsBar } from "@/components/stats-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Goal } from "@/lib/types"
import { DEFAULT_CATEGORIES } from "@/lib/types"
import { Plus, Search, LayoutGrid, Target } from "lucide-react"

export function Dashboard() {
  const { goals, isLoading } = useGoals()

  const [formOpen, setFormOpen] = useState(false)
  const [editGoal, setEditGoal] = useState<Goal | null>(null)
  const [detailGoal, setDetailGoal] = useState<Goal | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      if (search) {
        const q = search.toLowerCase()
        const matchesSearch =
          goal.title.toLowerCase().includes(q) ||
          goal.description.toLowerCase().includes(q) ||
          goal.tag?.toLowerCase().includes(q)
        if (!matchesSearch) return false
      }
      if (categoryFilter !== "all" && goal.category !== categoryFilter) return false
      if (statusFilter !== "all" && goal.status !== statusFilter) return false
      return true
    })
  }, [goals, search, categoryFilter, statusFilter])

  const handleGoalClick = (goal: Goal) => {
    setDetailGoal(goal)
    setDetailOpen(true)
  }

  const handleEditFromDetail = (goal: Goal) => {
    setEditGoal(goal)
    setFormOpen(true)
  }

  const handleNewGoal = () => {
    setEditGoal(null)
    setFormOpen(true)
  }

  // Keep detail in sync with changes
  const currentDetailGoal = useMemo(() => {
    if (!detailGoal) return null
    return goals.find((g) => g.id === detailGoal.id) ?? null
  }, [goals, detailGoal])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading goals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <StatsBar goals={goals} />

      {/* Chart */}
      <ProgressChart goals={goals} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search goals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {DEFAULT_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="not-started">Not Started</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="abandoned">Abandoned</SelectItem>
            </SelectContent>
          </Select>
          <ImportExport />
          <Button onClick={handleNewGoal} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">New Goal</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Goal Cards */}
      {filteredGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg text-foreground">
            {goals.length === 0 ? "No goals yet" : "No matching goals"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {goals.length === 0
              ? "Create your first goal to start tracking your progress. Use a SMART template or write freely."
              : "Try adjusting your search or filters to find what you're looking for."}
          </p>
          {goals.length === 0 && (
            <Button onClick={handleNewGoal} className="mt-4">
              <Plus className="mr-1.5 h-4 w-4" />
              Create Your First Goal
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onClick={handleGoalClick} />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <GoalFormDialog
        key={editGoal?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        editGoal={editGoal}
      />
      <GoalDetailDialog
        goal={currentDetailGoal}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEditFromDetail}
      />
    </div>
  )
}
