"use client"

import React from "react"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { exportGoals, importGoals } from "@/lib/goal-store"
import { Download, Upload, FileJson } from "lucide-react"

export function ImportExport() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    const goals = await exportGoals()
    const json = JSON.stringify(goals, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `goals-export-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!Array.isArray(data)) {
        alert("Invalid file format. Expected an array of goals.")
        return
      }
      await importGoals(data)
    } catch {
      alert("Failed to import goals. Please check the file format.")
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Import goals from JSON file"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <FileJson className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Import / Export</span>
            <span className="sm:hidden">JSON</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export as JSON
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleImport}>
            <Upload className="mr-2 h-4 w-4" />
            Import from JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
