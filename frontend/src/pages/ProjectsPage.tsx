import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { apiRequest } from "@/lib/utils"
import type { Project } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Folder, Loader2 } from "lucide-react"

interface ProjectsResponse {
  projects: Project[]
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDesc, setNewProjectDesc] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const data = await apiRequest<ProjectsResponse>("/projects", { method: "GET" })
      setProjects(data.projects || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return

    setIsCreating(true)
    try {
      const project = await apiRequest<Project>("/projects", {
        method: "POST",
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDesc,
        }),
      })
      setProjects([...projects, project])
      setNewProjectName("")
      setNewProjectDesc("")
      setShowCreateForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project")
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
            <CardDescription>Add a new project to your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="Description (optional)"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Project"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Link key={project.id} to={`/projects/${project.id}`}>
            <Card className="h-full cursor-pointer transition-colors hover:bg-accent/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Folder className="h-5 w-5" />
                  {project.name}
                </CardTitle>
                {project.description && (
                  <CardDescription className="line-clamp-2">
                    {project.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {projects.length === 0 && !showCreateForm && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Folder className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-lg font-medium">No projects yet</p>
            <p className="mb-4 text-sm text-muted-foreground">
              Create your first project to get started
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}