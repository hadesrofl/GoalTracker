import type { Goal, Category, ExportData } from "./types"
import { INITIAL_CATEGORIES } from "./types"

export interface GoalRepository {
  getAll(): Promise<Goal[]>
  getById(id: string): Promise<Goal | null>
  create(goal: Goal): Promise<Goal>
  update(goal: Goal): Promise<Goal>
  delete(id: string): Promise<void>
  importData(data: ExportData): Promise<void>
  exportData(): Promise<ExportData>
}

export interface CategoryRepository {
  getAll(): Promise<Category[]>
  create(category: Category): Promise<Category>
  update(category: Category): Promise<Category>
  delete(id: string): Promise<void>
  setAll(categories: Category[]): Promise<void>
}

const GOALS_KEY = "goal-tracker-goals"
const CATEGORIES_KEY = "goal-tracker-categories"

/** Migrate a goal from old format (tag: string) to new (tags: string[]) */
function migrateGoal(goal: Record<string, unknown>): Goal {
  const g = goal as Goal & { tag?: string }
  if (!Array.isArray(g.tags)) {
    g.tags = g.tag ? [g.tag] : []
  }
  delete (g as Record<string, unknown>).tag
  return g as Goal
}

function readGoalsFromStorage(): Goal[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(GOALS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return (parsed as Record<string, unknown>[]).map(migrateGoal)
  } catch {
    return []
  }
}

function writeGoalsToStorage(goals: Goal[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals))
}

function readCategoriesFromStorage(): Category[] {
  if (typeof window === "undefined") return INITIAL_CATEGORIES
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY)
    if (!raw) return INITIAL_CATEGORIES
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : INITIAL_CATEGORIES
  } catch {
    return INITIAL_CATEGORIES
  }
}

function writeCategoriesToStorage(categories: Category[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
}

export class LocalStorageGoalRepository implements GoalRepository {
  async getAll(): Promise<Goal[]> {
    return readGoalsFromStorage()
  }

  async getById(id: string): Promise<Goal | null> {
    const goals = readGoalsFromStorage()
    return goals.find((g) => g.id === id) ?? null
  }

  async create(goal: Goal): Promise<Goal> {
    const goals = readGoalsFromStorage()
    goals.push(goal)
    writeGoalsToStorage(goals)
    return goal
  }

  async update(goal: Goal): Promise<Goal> {
    const goals = readGoalsFromStorage()
    const index = goals.findIndex((g) => g.id === goal.id)
    if (index !== -1) {
      goals[index] = goal
      writeGoalsToStorage(goals)
    }
    return goal
  }

  async delete(id: string): Promise<void> {
    const goals = readGoalsFromStorage()
    writeGoalsToStorage(goals.filter((g) => g.id !== id))
  }

  async importData(data: ExportData): Promise<void> {
    // Merge goals (migrate old tag → tags)
    const existing = readGoalsFromStorage()
    const existingIds = new Set(existing.map((g) => g.id))
    const merged = [...existing]
    for (const raw of data.goals) {
      const goal = migrateGoal(raw)
      if (existingIds.has(goal.id)) {
        const idx = merged.findIndex((g) => g.id === goal.id)
        if (idx !== -1) merged[idx] = goal
      } else {
        merged.push(goal)
      }
    }
    writeGoalsToStorage(merged)

    // Merge categories (ensure color field)
    if (data.categories && data.categories.length > 0) {
      const existingCats = readCategoriesFromStorage()
      const existingCatIds = new Set(existingCats.map((c) => c.id))
      const mergedCats = [...existingCats]
      for (const cat of data.categories) {
        if (!existingCatIds.has(cat.id)) {
          mergedCats.push({ ...cat, color: cat.color || "#14b8a6" })
        }
      }
      writeCategoriesToStorage(mergedCats)
    }
  }

  async exportData(): Promise<ExportData> {
    return {
      goals: readGoalsFromStorage(),
      categories: readCategoriesFromStorage(),
    }
  }
}

export class LocalStorageCategoryRepository implements CategoryRepository {
  async getAll(): Promise<Category[]> {
    return readCategoriesFromStorage()
  }

  async create(category: Category): Promise<Category> {
    const categories = readCategoriesFromStorage()
    categories.push(category)
    writeCategoriesToStorage(categories)
    return category
  }

  async update(category: Category): Promise<Category> {
    const categories = readCategoriesFromStorage()
    const index = categories.findIndex((c) => c.id === category.id)
    if (index !== -1) {
      categories[index] = category
      writeCategoriesToStorage(categories)
    }
    return category
  }

  async delete(id: string): Promise<void> {
    const categories = readCategoriesFromStorage()
    writeCategoriesToStorage(categories.filter((c) => c.id !== id))
  }

  async setAll(categories: Category[]): Promise<void> {
    writeCategoriesToStorage(categories)
  }
}

export const goalRepository: GoalRepository = new LocalStorageGoalRepository()
export const categoryRepository: CategoryRepository =
  new LocalStorageCategoryRepository()
