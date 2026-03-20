# Unified Project Command Center

A full-featured project management SaaS — an open-source alternative to **ClickUp**.

Built with Next.js + Supabase for the AI Mahakurukshetra Hackathon 2026.

---

## What it does

Unified Project Command Center is an all-in-one workspace for teams to plan, track, and ship work together. It consolidates task management, team collaboration, time tracking, and project insights into a single platform.

## Alternative to

**ClickUp** — All-in-one productivity platform

---

## Features

- **Task Management** — Create, assign, and prioritize tasks with due dates, status, and priority levels
- **Project Hierarchies** — Workspaces → Projects → Lists → Tasks → Subtasks
- **Multiple Views** — List view and Kanban board with drag-and-drop
- **Team Collaboration** — Real-time comments and activity feed
- **Time Tracking** — Built-in timer, manual time logging, timesheets
- **Notifications** — Real-time in-app notifications for assignments and comments
- **Dashboard** — Personalized overview with open tasks, overdue alerts, workspace stats
- **Search** — Global search across tasks and projects
- **Role-based Access** — Owner, Admin, Member, Viewer roles per workspace

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime |
| State | TanStack Query + Zustand |
| Drag & Drop | @dnd-kit |
| Deployment | Vercel |

---

## Getting Started

### 1. Clone and install
```bash
git clone <repo-url>
cd ai_project
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Run database migrations + seed data
```bash
npx supabase link --project-ref your-project-ref
npx supabase db push --include-seed
```

### 4. Start the app
```bash
npm run dev
# Open http://localhost:3000
```

---

## Built With AI

100% built using **Claude Code CLI** as part of the AI Mahakurukshetra Vibe Coding Hackathon 2026.
