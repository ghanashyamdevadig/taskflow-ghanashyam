import { Routes, Route, Navigate } from "react-router-dom"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Layout } from "@/components/Layout"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { ProjectsPage } from "@/pages/ProjectsPage"
import { ProjectDetailPage } from "@/pages/ProjectDetailPage"

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <Layout>
              <ProjectsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <ProjectDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/projects" replace />} />
    </Routes>
  )
}

export default App