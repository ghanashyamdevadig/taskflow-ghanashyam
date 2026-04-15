import { ReactNode } from "react"
import { Navbar } from "@/components/Navbar"

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-6">
        {children}
      </main>
    </div>
  )
}