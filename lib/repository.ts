import type { Goal } from "./types"

export interface GoalRepository {
  getAll(): Promise<Goal[]>
  getById(id: string): Promise<Goal | null>
  create(goal: Goal): Promise<Goal>
  update(goal: Goal): Promise<Goal>
  delete(id: string): Promise<void>
  importGoals(goals: Goal[]): Promise<void>
  exportGoals(): Promise<Goal[]>
}

const STORAGE_KEY = "goal-tracker-goals"

function readFromStorage(): Goal[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeToStorage(goals: Goal[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals))
}

export class LocalStorageGoalRepository implements GoalRepository {
  async getAll(): Promise<Goal[]> {
    return readFromStorage()
  }

  async getById(id: string): Promise<Goal | null> {
    const goals = readFromStorage()
    return goals.find((g) => g.id === id) ?? null
  }

  async create(goal: Goal): Promise<Goal> {
    const goals = readFromStorage()
    goals.push(goal)
    writeToStorage(goals)
    return goal
  }

  async update(goal: Goal): Promise<Goal> {
    const goals = readFromStorage()
    const index = goals.findIndex((g) => g.id === goal.id)
    if (index !== -1) {
      goals[index] = goal
      writeToStorage(goals)
    }
    return goal
  }

  async delete(id: string): Promise<void> {
    const goals = readFromStorage()
    writeToStorage(goals.filter((g) => g.id !== id))
  }

  async importGoals(imported: Goal[]): Promise<void> {
    const existing = readFromStorage()
    const existingIds = new Set(existing.map((g) => g.id))
    const merged = [...existing]
    for (const goal of imported) {
      if (existingIds.has(goal.id)) {
        const idx = merged.findIndex((g) => g.id === goal.id)
        if (idx !== -1) merged[idx] = goal
      } else {
        merged.push(goal)
      }
    }
    writeToStorage(merged)
  }

  async exportGoals(): Promise<Goal[]> {
    return readFromStorage()
  }
}

export const goalRepository: GoalRepository = new LocalStorageGoalRepository()
