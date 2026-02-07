import useSWR, { mutate } from "swr"
import { goalRepository, categoryRepository } from "./repository"
import type { Goal, Category, ExportData } from "./types"

const GOALS_KEY = "goals"
const CATEGORIES_KEY = "categories"

export function useGoals() {
  const { data, error, isLoading } = useSWR(GOALS_KEY, () =>
    goalRepository.getAll()
  )

  return {
    goals: data ?? [],
    isLoading,
    error,
  }
}

export function useCategories() {
  const { data, error, isLoading } = useSWR(CATEGORIES_KEY, () =>
    categoryRepository.getAll()
  )

  return {
    categories: data ?? [],
    isLoading,
    error,
  }
}

export async function createGoal(goal: Goal) {
  await goalRepository.create(goal)
  mutate(GOALS_KEY)
}

export async function updateGoal(goal: Goal) {
  await goalRepository.update(goal)
  mutate(GOALS_KEY)
}

export async function deleteGoal(id: string) {
  await goalRepository.delete(id)
  mutate(GOALS_KEY)
}

export async function createCategory(category: Category) {
  await categoryRepository.create(category)
  mutate(CATEGORIES_KEY)
}

export async function updateCategory(category: Category) {
  await categoryRepository.update(category)
  mutate(CATEGORIES_KEY)
}

export async function deleteCategory(id: string) {
  await categoryRepository.delete(id)
  mutate(CATEGORIES_KEY)
}

export async function importData(data: ExportData) {
  await goalRepository.importData(data)
  mutate(GOALS_KEY)
  mutate(CATEGORIES_KEY)
}

export async function exportData(): Promise<ExportData> {
  return goalRepository.exportData()
}
