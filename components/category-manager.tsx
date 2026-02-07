"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/goal-store"
import { generateId, CATEGORY_COLORS } from "@/lib/types"
import { Plus, Pencil, Trash2, Check, X, Settings } from "lucide-react"

interface CategoryManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CATEGORY_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{
            backgroundColor: color,
            borderColor: value === color ? "hsl(var(--foreground))" : "transparent",
          }}
          onClick={() => onChange(color)}
          aria-label={`Select color ${color}`}
        />
      ))}
    </div>
  )
}

export function CategoryManager({ open, onOpenChange }: CategoryManagerProps) {
  const { categories } = useCategories()
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState(CATEGORY_COLORS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [editingColor, setEditingColor] = useState("")
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const handleCreate = async () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) return
    await createCategory({ id: generateId(), name: trimmed, color: newColor })
    setNewName("")
    setNewColor(CATEGORY_COLORS[0])
  }

  const handleStartEdit = (id: string, name: string, color: string) => {
    setEditingId(id)
    setEditingName(name)
    setEditingColor(color)
    setConfirmDeleteId(null)
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    const trimmed = editingName.trim()
    if (!trimmed) return
    if (
      categories.some(
        (c) => c.id !== editingId && c.name.toLowerCase() === trimmed.toLowerCase()
      )
    )
      return
    await updateCategory({ id: editingId, name: trimmed, color: editingColor })
    setEditingId(null)
    setEditingName("")
    setEditingColor("")
  }

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      return
    }
    await deleteCategory(id)
    setConfirmDeleteId(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manage Categories
          </DialogTitle>
          <DialogDescription>
            Create, rename, or delete categories for your goals.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Add new category */}
          <div className="grid gap-2">
            <div className="flex gap-2">
              <Input
                placeholder="New category name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleCreate()
                  }
                }}
              />
              <Button
                size="icon"
                onClick={handleCreate}
                disabled={!newName.trim()}
                aria-label="Add category"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ColorPicker value={newColor} onChange={setNewColor} />
          </div>

          {/* Category list */}
          <div className="space-y-1">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary"
              >
                {editingId === cat.id ? (
                  <div className="flex-1 grid gap-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-8 flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleSaveEdit()
                          }
                          if (e.key === "Escape") {
                            setEditingId(null)
                          }
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="text-primary hover:text-primary/80 transition-colors"
                        aria-label="Save"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <ColorPicker value={editingColor} onChange={setEditingColor} />
                  </div>
                ) : (
                  <>
                    <span
                      className="h-3.5 w-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm flex-1 text-secondary-foreground">
                      {cat.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(cat.id, cat.name, cat.color)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={`Edit ${cat.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat.id)}
                      className={`transition-colors ${
                        confirmDeleteId === cat.id
                          ? "text-destructive"
                          : "text-muted-foreground hover:text-destructive"
                      }`}
                      aria-label={
                        confirmDeleteId === cat.id
                          ? `Confirm delete ${cat.name}`
                          : `Delete ${cat.name}`
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No categories yet. Add one above.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
