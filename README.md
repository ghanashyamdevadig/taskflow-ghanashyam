# TaskFlow

A minimal but real task management system built as a frontend-only submission for the TaskFlow engineering take-home assignment.

## Overview

This is the **Frontend-only** submission, which uses a mock API (json-server with JWT authentication) to simulate the backend. The frontend is built with React, TypeScript, and a custom component library based on Radix UI primitives.

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Component Library**: Custom components using Radix UI primitives + Tailwind CSS
- **Mock API**: json-server with JWT authentication
- **Icons**: Lucide React
- **Deployment**: Docker with nginx

## Architecture Decisions

### Why mock API instead of real backend?
As a frontend-only candidate, I built against a mock API that simulates the real backend behavior:
- JWT authentication flow works exactly as specified in the requirements
- All CRUD operations for projects and tasks are functional
- Proper error responses (400, 401, 404) are implemented

### Why Separate Files for Everything?

This project follows the **separation of concerns** principle - each responsibility has its own file. Here's why:

#### 1. API Calls (`src/lib/utils.ts`)
**Why separate:**
- Single source of truth for all HTTP requests
- Automatic JWT token injection from localStorage on every request
- Consistent error handling across all endpoints
- Easy to modify base URL or headers in one place
- Reusable across all pages and components

```typescript
// Instead of repeating fetch() with headers everywhere:
const response = await fetch('/projects', { headers: { Authorization: ... } })

// We use:
const data = await apiRequest<ProjectsResponse>("/projects")
```

#### 2. State Management (Separate Locations)
**Why separate:**

- **Auth state** (`src/contexts/AuthContext.tsx`): Global state needed everywhere (user info, token, login/logout)
  - Uses React Context pattern
  - Persists to localStorage for session durability
  
- **Page state** (`src/pages/*.tsx`): Local state needed only in that specific page
  - Uses useState hooks
  - Isolated to individual components

**Why not one file?** Because global state (auth) is accessed from many places, while page state is specific to one view. Mixing them would create unnecessary complexity.

#### 3. Database Setup (`mock-api/` folder)
**Why separate folder:**
- `db.json`: Simple JSON file as data store - easy to view, edit, and reset
- `server.cjs`: Custom Node.js server with business logic
- No external database dependencies - runs completely locally
- Can be easily replaced with a real backend later

**Why not use json-server directly?**
- Custom JWT authentication logic
- Custom authorization (only show projects user owns or is assigned to)
- More control over error responses

#### 4. UI Components (`src/components/ui/`)
**Why separate folder:**
- Atomic design: Button, Input, Card, Dialog, etc.
- Reusable across all pages - DRY principle
- Easy to maintain and update in one place
- Can build complex UIs by composing simple components

```typescript
// Instead of writing <button class="..."> everywhere:
// Reusable Button component used everywhere
<Button>Click me</Button>
<Button variant="destructive">Delete</Button>
```

#### 5. Types (`src/lib/types.ts`)
**Why separate:**
- Single source of truth for all TypeScript interfaces
- Ensures consistency - Project interface used everywhere is the same
- Easy to find and modify data models
- IDE autocomplete works across the entire app

```typescript
// One definition, used everywhere:
interface Project { id, name, description, owner_id, created_at }

// In LoginPage: apiRequest<AuthResponse>(...)
// In ProjectsPage: apiRequest<ProjectsResponse>(...)
// In ProjectDetailPage: apiRequest<ProjectWithTasks>(...)
```

### Architecture Benefits

| Benefit | How It's Achieved |
|---------|-------------------|
| **Maintainability** | Each concern in its own file - easy to find what to change |
| **Reusability** | UI components can be used anywhere; apiRequest used everywhere |
| **Testability** | Can test pieces in isolation (test utils.ts separately, test components separately) |
| **Scalability** | Easy to add new features without touching existing code |
| **Readability** | Clear structure - developer knows where to look |
| **DX (Developer Experience)** | IDE autocomplete, type checking, organized code |

### Additional Architecture Details

#### Component Library Choice
I chose to build custom components using Radix UI primitives instead of using a pre-built library like shadcn/ui or Chakra UI. This demonstrates:
- **Understanding of accessible component patterns** - Radix provides accessible primitives (Dialog, Select, Toast, etc.)
- **Ability to integrate with design systems** - Custom styling with Tailwind CSS gives full control
- **Custom styling control** - Not constrained by library defaults

The UI components are in `src/components/ui/` and include:
- Button, Input, Label (basic form elements)
- Card (content containers)
- Dialog (modals)
- Select (dropdowns)
- Toast (notifications)

#### State Management Approach
- **Auth state**: React Context (`AuthContext.tsx`) - global, persisted to localStorage
- **Page state**: useState hooks - local to each page
- **API calls**: Centralized in `utils.ts` - handles JWT injection automatically
- **Optimistic UI**: Task status changes update UI immediately before server confirmation

This hybrid approach (Context + useState) is perfect for this app's complexity - no need for Redux/Zustand.

### What Was Intentionally Left Out
- Backend implementation (Go/PostgreSQL) - not required for frontend role
- Real-time features (WebSocket/SSE) - would require backend support
- Drag-and-drop - bonus feature that would add significant complexity

## Running Locally

### Prerequisites
- Docker and Docker Compose installed

### Option 1: Docker (Recommended)
```bash
# From the repository root
cp frontend/.env.example .env
docker compose up --build
```

The application will be available at:
- Frontend (Docker): http://localhost:3001
- Mock API (Docker): http://localhost:4001

### Option 2: Development Mode (Local)
```bash
# Terminal 1 - Start the mock API
cd frontend
npm install
npm run dev:api

# Terminal 2 - Start the frontend
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:3000 (local) and the API at http://localhost:4000

## Test Credentials

The mock API is seeded with a test user:
- **Email**: test@example.com
- **Password**: password123

## API Reference

### Base URL
- **Local Development**: http://localhost:4000
- **Docker**: http://localhost:4001 (direct access) or http://localhost:3001/api (via nginx)

### Authentication

**POST /auth/register**
```json
// Request
{ "name": "Jane Doe", "email": "jane@example.com", "password": "secret123" }

// Response 201
{ "token": "<jwt>", "user": { "id": "uuid", "name": "Jane Doe", "email": "jane@example.com" } }
```

**POST /auth/login**
```json
// Request
{ "email": "test@example.com", "password": "password123" }

// Response 200
{ "token": "<jwt>", "user": { "id": "user-1", "name": "Test User", "email": "test@example.com" } }
```

### Projects

**GET /projects** - List user's projects
**POST /projects** - Create a project
**GET /projects/:id** - Get project with tasks
**PATCH /projects/:id** - Update project
**DELETE /projects/:id** - Delete project

### Tasks

**GET /projects/:id/tasks** - List tasks (supports `?status=` filter)
**POST /projects/:id/tasks** - Create a task
**PATCH /tasks/:id** - Update task
**DELETE /tasks/:id** - Delete task

## Pages

| View | Path | Description |
|------|------|-------------|
| Login | /login | User login |
| Register | /register | User registration |
| Projects List | /projects | All accessible projects |
| Project Detail | /projects/:id | Tasks organized by status |

## Features Implemented

- [x] JWT authentication with localStorage persistence
- [x] Protected routes (redirect to /login if unauthenticated)
- [x] Project CRUD operations
- [x] Task CRUD operations
- [x] Task status filtering
- [x] Task grouping by status (todo/in_progress/done)
- [x] Optimistic UI for task updates
- [x] Loading states
- [x] Error handling with user feedback
- [x] Empty states
- [x] Responsive design (375px - 1280px)
- [x] Client-side form validation

## What I'd Do With More Time

1. **Real Backend**: Implement the Go backend with PostgreSQL as specified
2. **Drag-and-Drop**: Add react-beautiful-dnd for task reordering
3. **Dark Mode**: Add theme toggle with persistence
4. **Pagination**: Implement pagination for projects and tasks lists
5. **Tests**: Add unit and integration tests with Jest/React Testing Library
6. **Real-time**: Add WebSocket support for live task updates