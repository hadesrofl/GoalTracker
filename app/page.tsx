"use client"

import { Dashboard } from "@/components/dashboard"
import { Target } from "lucide-react"

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-14">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary">
                <Target className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-bold text-card-foreground">
                GoalTracker
              </h1>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <Dashboard />
      </main>
    </div>
  )
}
