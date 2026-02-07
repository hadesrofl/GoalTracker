import useSWR, { mutate } from "swr"
import { goalRepository } from "./repository"
import type { Goal } from "./types"

const GOALS_KEY = "goals"

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

export async function importGoals(goals: Goal[]) {
  await goalRepository.importGoals(goals)
  mutate(GOALS_KEY)
}

export async function exportGoals(): Promise<Goal[]> {
  return goalRepository.exportGoals()
}
