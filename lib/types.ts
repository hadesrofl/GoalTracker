export type MilestoneStatus =
  | "not-started"
  | "in-progress"
  | "completed"
  | "dropped"

export interface Milestone {
  id: string
  title: string
  description?: string
  endDate?: string
  status: MilestoneStatus
  parentMilestoneId?: string
  completedAt?: string
}

export type GoalStatus =
  | "not-started"
  | "in-progress"
  | "completed"
  | "abandoned"

export interface Goal {
  id: string
  title: string
  description: string
  category?: string
  tags: string[]
  endDate: string
  status: GoalStatus
  milestones: Milestone[]
  template?: string
  createdAt: string
  completedAt?: string
}

export interface Category {
  id: string
  name: string
  color: string
}

export interface GoalTemplate {
  id: string
  name: string
  description: string
  sections: { label: string; placeholder: string }[]
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: "smart",
    name: "SMART Goal",
    description: "Specific, Measurable, Achievable, Relevant, Time-bound",
    sections: [
      {
        label: "Specific",
        placeholder: "What exactly do you want to accomplish?",
      },
      {
        label: "Measurable",
        placeholder: "How will you measure your progress and success?",
      },
      {
        label: "Achievable",
        placeholder:
          "Is this goal realistic? What resources do you need?",
      },
      {
        label: "Relevant",
        placeholder:
          "Why does this goal matter to you? How does it align with your broader objectives?",
      },
      {
        label: "Time-bound",
        placeholder:
          "What is your deadline? What are the key milestones along the way?",
      },
    ],
  },
  {
    id: "okr",
    name: "OKR",
    description: "Objective and Key Results",
    sections: [
      {
        label: "Objective",
        placeholder:
          "What is the high-level objective you want to achieve?",
      },
      {
        label: "Key Result 1",
        placeholder: "First measurable key result",
      },
      {
        label: "Key Result 2",
        placeholder: "Second measurable key result",
      },
      {
        label: "Key Result 3",
        placeholder: "Third measurable key result",
      },
    ],
  },
  {
    id: "free",
    name: "Free Form",
    description: "Write your goal in your own words",
    sections: [
      {
        label: "Description",
        placeholder: "Describe your goal in detail...",
      },
    ],
  },
]

export const CATEGORY_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#6366f1", // indigo
  "#84cc16", // lime
  "#06b6d4", // cyan
  "#a855f7", // purple
]

export const INITIAL_CATEGORIES: Category[] = [
  { id: "health-fitness", name: "Health & Fitness", color: "#10b981" },
  { id: "career-professional", name: "Career & Professional", color: "#3b82f6" },
  { id: "education-learning", name: "Education & Learning", color: "#6366f1" },
  { id: "financial", name: "Financial", color: "#f59e0b" },
  { id: "personal-development", name: "Personal Development", color: "#8b5cf6" },
  { id: "relationships", name: "Relationships", color: "#ec4899" },
  { id: "creative", name: "Creative", color: "#f97316" },
  { id: "other", name: "Other", color: "#14b8a6" },
]

export interface ExportData {
  goals: Goal[]
  categories: Category[]
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Derive a parent milestone's status from its direct children.
 * - No children → returns null (keep own status)
 * - All children dropped → "dropped"
 * - All active (non-dropped) children completed → "completed"
 * - Any child in-progress or completed → "in-progress"
 * - Otherwise → "not-started"
 */
export function deriveMilestoneStatus(
  parentId: string,
  allMilestones: Milestone[]
): MilestoneStatus | null {
  const children = allMilestones.filter(
    (m) => m.parentMilestoneId === parentId
  )
  if (children.length === 0) return null

  if (children.every((m) => m.status === "dropped")) return "dropped"

  const active = children.filter((m) => m.status !== "dropped")
  if (active.length > 0 && active.every((m) => m.status === "completed")) {
    return "completed"
  }

  if (
    children.some(
      (m) => m.status === "in-progress" || m.status === "completed"
    )
  ) {
    return "in-progress"
  }

  return "not-started"
}

/**
 * After a milestone's status changes, propagate status upward through
 * the parent chain. Returns a new milestones array with updated parents.
 */
export function propagateMilestoneStatuses(
  milestones: Milestone[],
  changedId: string
): Milestone[] {
  let result = [...milestones]
  let currentId: string | undefined = changedId

  while (currentId) {
    const current = result.find((m) => m.id === currentId)
    if (!current?.parentMilestoneId) break

    const parentId = current.parentMilestoneId
    const derived = deriveMilestoneStatus(parentId, result)

    if (derived !== null) {
      result = result.map((m) =>
        m.id === parentId
          ? {
              ...m,
              status: derived,
              completedAt:
                derived === "completed"
                  ? m.completedAt ?? new Date().toISOString()
                  : m.status === "completed" && derived !== "completed"
                    ? undefined
                    : m.completedAt,
            }
          : m
      )
    }

    currentId = parentId
  }

  return result
}

/**
 * Derive goal status from its top-level milestones.
 * - All dropped → abandoned
 * - All active (non-dropped) completed → completed
 * - Any in-progress or completed → in-progress
 * - Otherwise → not-started
 */
export function deriveGoalStatus(milestones: Milestone[]): GoalStatus {
  if (milestones.length === 0) return "not-started"

  const allDropped = milestones.every((m) => m.status === "dropped")
  if (allDropped) return "abandoned"

  const active = milestones.filter((m) => m.status !== "dropped")
  if (active.length > 0 && active.every((m) => m.status === "completed")) {
    return "completed"
  }

  const hasProgress = milestones.some(
    (m) => m.status === "in-progress" || m.status === "completed"
  )
  if (hasProgress) return "in-progress"

  return "not-started"
}
