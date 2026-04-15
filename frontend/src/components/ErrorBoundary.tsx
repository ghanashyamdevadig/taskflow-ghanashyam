import { Component, ErrorInfo, ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold text-destructive">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">{this.state.error?.message}</p>
            <button
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}