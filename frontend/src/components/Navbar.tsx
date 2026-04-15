import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { LogOut, Layout } from "lucide-react"

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  if (!user) return null

  return (
    <nav className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/projects" className="flex items-center gap-2 text-xl font-bold">
          <Layout className="h-6 w-6" />
          <span>TaskFlow</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user.name}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  )
}