import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { apiRequest } from "@/lib/utils"
import type { Task } from "@/lib/types"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { TaskDialog } from "@/components/TaskDialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, ArrowLeft, Loader2, Calendar, Flag } from "lucide-react"

interface ProjectResponse {
  id: string
  name: string
  description: string
  owner_id: string
  created_at: string
  tasks: Task[]
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [project, setProject] = useState<ProjectResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [statusFilter, setStatusFilter] = useState<string>("")

  useEffect(() => {
    if (id) {
      loadProject()
    }
  }, [id])

  const loadProject = async () => {
    try {
      const data = await apiRequest<ProjectResponse>(`/projects/${id}`, { method: "GET" })
      setProject(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTask = () => {
    setEditingTask(undefined)
    setTaskDialogOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setTaskDialogOpen(true)
  }

  const handleTaskSuccess = (task: Task) => {
    if (!project) return
    
    const existingTaskIndex = project.tasks.findIndex(t => t.id === task.id)
    let updatedTasks: Task[]
    
    if (existingTaskIndex >= 0) {
      updatedTasks = [...project.tasks]
      updatedTasks[existingTaskIndex] = task
    } else {
      updatedTasks = [...project.tasks, task]
    }
    
    setProject({ ...project, tasks: updatedTasks })
  }

  const handleTaskDelete = (taskId: string) => {
    if (!project) return
    const updatedTasks = project.tasks.filter(t => t.id !== taskId)
    setProject({ ...project, tasks: updatedTasks })
  }

  const filteredTasks = project?.tasks.filter(t => 
    statusFilter ? t.status === statusFilter : true
  ) || []

  const todoTasks = filteredTasks.filter(t => t.status === "todo")
  const inProgressTasks = filteredTasks.filter(t => t.status === "in_progress")
  const doneTasks = filteredTasks.filter(t => t.status === "done")

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && !project) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="mb-4 text-destructive">{error}</p>
        <Link to="/projects">
          <Button variant="outline">Back to Projects</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{project?.name}</h1>
          {project?.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <Button onClick={handleCreateTask}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Todo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todoTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks</p>
            ) : (
              todoTasks.map(task => (
                <div
                  key={task.id}
                  className="rounded-md border p-3 cursor-pointer transition-colors hover:bg-accent/50"
                  onClick={() => handleEditTask(task)}
                >
                  <p className="font-medium">{task.title}</p>
                  {task.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    {task.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                    <span className={`flex items-center gap-1 ${task.priority === 'high' ? 'text-red-500' : task.priority === 'medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                      <Flag className="h-3 w-3" />
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {inProgressTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks</p>
            ) : (
              inProgressTasks.map(task => (
                <div
                  key={task.id}
                  className="rounded-md border p-3 cursor-pointer transition-colors hover:bg-accent/50"
                  onClick={() => handleEditTask(task)}
                >
                  <p className="font-medium">{task.title}</p>
                  {task.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    {task.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                    <span className={`flex items-center gap-1 ${task.priority === 'high' ? 'text-red-500' : task.priority === 'medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                      <Flag className="h-3 w-3" />
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Done</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {doneTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks</p>
            ) : (
              doneTasks.map(task => (
                <div
                  key={task.id}
                  className="rounded-md border p-3 cursor-pointer transition-colors hover:bg-accent/50"
                  onClick={() => handleEditTask(task)}
                >
                  <p className="font-medium">{task.title}</p>
                  {task.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    {task.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                    <span className={`flex items-center gap-1 ${task.priority === 'high' ? 'text-red-500' : task.priority === 'medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                      <Flag className="h-3 w-3" />
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {project?.tasks?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-lg font-medium">No tasks yet</p>
            <p className="mb-4 text-sm text-muted-foreground">
              Create your first task to get started
            </p>
            <Button onClick={handleCreateTask}>
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          </CardContent>
        </Card>
      )}

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        projectId={id!}
        task={editingTask}
        currentUserId={user?.id || ""}
        onSuccess={handleTaskSuccess}
        onDelete={handleTaskDelete}
      />
    </div>
  )
}