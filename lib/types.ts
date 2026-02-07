export interface Milestone {
  id: string
  title: string
  completed: boolean
  completedAt?: string
}

export type GoalStatus = "not-started" | "in-progress" | "completed" | "abandoned"

export interface Goal {
  id: string
  title: string
  description: string
  category?: string
  tag?: string
  endDate: string
  status: GoalStatus
  milestones: Milestone[]
  template?: string
  createdAt: string
  completedAt?: string
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
      { label: "Specific", placeholder: "What exactly do you want to accomplish?" },
      { label: "Measurable", placeholder: "How will you measure your progress and success?" },
      { label: "Achievable", placeholder: "Is this goal realistic? What resources do you need?" },
      { label: "Relevant", placeholder: "Why does this goal matter to you? How does it align with your broader objectives?" },
      { label: "Time-bound", placeholder: "What is your deadline? What are the key milestones along the way?" },
    ],
  },
  {
    id: "okr",
    name: "OKR",
    description: "Objective and Key Results",
    sections: [
      { label: "Objective", placeholder: "What is the high-level objective you want to achieve?" },
      { label: "Key Result 1", placeholder: "First measurable key result" },
      { label: "Key Result 2", placeholder: "Second measurable key result" },
      { label: "Key Result 3", placeholder: "Third measurable key result" },
    ],
  },
  {
    id: "free",
    name: "Free Form",
    description: "Write your goal in your own words",
    sections: [
      { label: "Description", placeholder: "Describe your goal in detail..." },
    ],
  },
]

export const DEFAULT_CATEGORIES = [
  "Health & Fitness",
  "Career & Professional",
  "Education & Learning",
  "Financial",
  "Personal Development",
  "Relationships",
  "Creative",
  "Other",
]
