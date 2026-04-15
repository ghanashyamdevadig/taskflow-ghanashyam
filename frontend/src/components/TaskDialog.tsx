import { useState, useEffect } from "react"
import { apiRequest } from "@/lib/utils"
import type { Task, TaskStatus, TaskPriority, User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trash2, UserMinus, UserPlus } from "lucide-react"

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  task?: Task
  currentUserId: string
  onSuccess: (task: Task) => void
  onDelete?: (taskId: string) => void
}

export function TaskDialog({ open, onOpenChange, projectId, task, currentUserId, onSuccess, onDelete }: TaskDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<TaskStatus>("todo")
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [dueDate, setDueDate] = useState("")
  const [assigneeId, setAssigneeId] = useState<string>("unassigned")
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || "")
      setStatus(task.status)
      setPriority(task.priority)
      setDueDate(task.due_date || "")
      setAssigneeId(task.assignee_id || "unassigned")
    } else {
      setTitle("")
      setDescription("")
      setStatus("todo")
      setPriority("medium")
      setDueDate("")
      setAssigneeId("unassigned")
    }
  }, [task, open])

  useEffect(() => {
    if (open) {
      console.log("Fetching users from /users...")
      apiRequest<{ users: User[] }>("/users", { method: "GET" })
        .then((data) => {
          console.log("Users fetched:", data.users)
          setUsers(data.users)
        })
        .catch((err) => console.error("Failed to fetch users:", err))
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsLoading(true)
    setError("")

    try {
      const payload = {
        title,
        description,
        status,
        priority,
        due_date: dueDate || null,
        assignee_id: assigneeId === "unassigned" ? null : assigneeId,
      }

      let result: Task
      if (task) {
        result = await apiRequest<Task>(`/tasks/${task.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      } else {
        result = await apiRequest<Task>(`/projects/${projectId}/tasks`, {
          method: "POST",
          body: JSON.stringify(payload),
        })
      }
      onSuccess(result)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save task")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!task) return
    
    setIsLoading(true)
    try {
      await apiRequest(`/tasks/${task.id}`, { method: "DELETE" })
      onDelete?.(task.id)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignMyself = () => {
    setAssigneeId(currentUserId)
  }

  const handleUnassign = () => {
    setAssigneeId("unassigned")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{task ? "Edit Task" : "Create Task"}</DialogTitle>
            <DialogDescription>
              {task ? "Update the task details below." : "Add a new task to this project."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v: TaskStatus) => setStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">Todo</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v: TaskPriority) => setPriority(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <div className="flex gap-2">
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    <SelectItem value={currentUserId}>Assign to me</SelectItem>
                    {users.filter(u => u.id !== currentUserId).map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {assigneeId === currentUserId ? (
                  <Button type="button" variant="outline" size="icon" onClick={handleUnassign} title="Unassign">
                    <UserMinus className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="button" variant="outline" size="icon" onClick={handleAssignMyself} title="Assign to me">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="justify-between">
            <div>
              {task && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isLoading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : task ? "Update" : "Create"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>

      {showDeleteConfirm && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Task</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this task? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}