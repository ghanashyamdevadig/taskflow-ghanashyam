import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { apiRequest } from "@/lib/utils"
import type { User, AuthResponse } from "@/lib/types"

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const response = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    
    localStorage.setItem("token", response.token)
    localStorage.setItem("user", JSON.stringify(response.user))
    setToken(response.token)
    setUser(response.user)
  }

  const register = async (name: string, email: string, password: string) => {
    const response = await apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    })
    
    localStorage.setItem("token", response.token)
    localStorage.setItem("user", JSON.stringify(response.user))
    setToken(response.token)
    setUser(response.user)
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}