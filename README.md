# ⚡ ZOC - Premium Task, Habit & Focus Tracker

A full-stack productivity application inspired by TickTick. Built using **Next.js 16 (App Router)**, **React 19**, **Prisma**, **PostgreSQL**, **Better Auth**, and styling powered by **Tailwind CSS v4** and **shadcn/ui**.

This application is designed to be an all-in-one workstation for task management, habit building, and Pomodoro-style focusing.

---

## 🛠️ Tech Stack & Key Technologies

- **Frontend Framework**: [Next.js 16 (App Router)](https://nextjs.org/) & [React 19](https://react.dev/)
- **Styling & Components**: [Tailwind CSS v4](https://tailwindcss.com/) & [@base-ui/react](https://base-ui.com/)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) & [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [Better Auth](https://www.better-auth.com/) (using the Prisma Adapter)
- **Icons**: [Phosphor Icons](https://phosphoricons.com/) & [Lucide React](https://lucide.dev/)
- **Development & Containerization**: [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

---

## ✨ Features

### 📅 Task & Project Management
- **Smart Inbox**: A default catch-all inbox for quick task dumping.
- **Projects & Folders**: Group lists under folders to organize different areas of life or work.
- **Multiple Board Views**:
  - **List View**: A classic, streamlined list interface.
  - **Kanban Board**: Drag-and-drop sections to visualize your work progression.
  - **Calendar View**: Schedule and view tasks dynamically.
- **Rich Task Details**:
  - Sub-tasks (hierarchical task tracking).
  - Priority levels (None, Low, Medium, High).
  - Scheduling (Start/Due dates, Durations, timezone, All-Day toggles).
  - Recurrence rules via **iCal RRULE strings** (e.g., `FREQ=DAILY;INTERVAL=1`).
  - Markdown note attachments for rich details.
  - Custom tags for cross-project classification.

### 🏃 Habit Tracker
- **Habit Design**: Create custom habits with unique icons, colors, and target goals.
- **Flexible Frequencies**: Daily, weekly (specific days of the week), or monthly trackers.
- **Habit Records**: Log daily progress and track streaks to build consistency.

### ⏱️ Pomodoro & Focus Timer
- **Dual Focus Modes**: Pomodoro (intervals with breaks) and standard Stopwatch mode.
- **Task Association**: Link your active focus session directly to a task to keep track of billable or logged hours.
- **History logs**: Review detailed records of focus durations.

---

## 🏗️ Project Architecture

The codebase is organized into **Feature-Based Modules** to ensure scalability, ease of navigation, and clear separation of concerns:

```
src/
├── app/                  # Next.js Pages & Route Handlers
├── components/           # Shared UI components (inputs, dialogs, buttons)
├── features/             # Feature-specific modules:
│   ├── calendar/         # Calendar views, logic, & utilities
│   ├── focus/            # Pomodoro / Stopwatch components & state
│   ├── habits/           # Habit list, tracking, & statistics
│   ├── projects/         # List, Kanban, Folder, and Member management
│   └── tasks/            # Task list, detail drawer, & sub-tasks
├── hooks/                # Global React hooks
├── lib/                  # Shared library clients (Prisma, auth, utils)
├── stores/               # Client-side state management
├── styles/               # Global styles & Tailwind configuration
├── tests/                # Automated unit and integration tests
└── types/                # Core TypeScript interfaces & schemas
```

---

## 🗄️ Database Schema

The database model is structured to support rich relations:

```mermaid
erDiagram
    User ||--o{ Project : owns
    User ||--o{ Folder : owns
    User ||--o{ Tag : creates
    User ||--o{ Habit : tracks
    User ||--o{ FocusRecord : records
    User ||--o{ ProjectMember : participates
    
    Folder ||--o{ Project : groups
    
    Project ||--o{ Section : contains
    Project ||--o{ Task : contains
    Project ||--o{ ProjectMember : lists
    
    Section ||--o{ Task : organizes
    
    Task ||--o{ Task : subtasks
    Task ||--o{ TagTask : tagged
    Tag ||--o{ TagTask : tags
    
    Task ||--o{ Reminder : alerts
    Task ||--o{ Attachment : holds
    Task ||--o{ FocusRecord : links
    
    Habit ||--o{ HabitRecord : logs
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20` or higher
- **Docker & Docker Compose** (Optional, but recommended for running the database locally)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/ticktick-clone.git
   cd ticktick-clone
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory based on the following template:
   ```env
   # PostgreSQL database connection string
   DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/ticktick_clone?sslmode=disable"
   
   # Better Auth Config
   BETTER_AUTH_SECRET="your-super-secret-random-key"
   BETTER_AUTH_URL="http://localhost:3000"
   ```

### Database Migration & Seed

Apply the database schema and populate the database with initial seed data:
```bash
npx prisma db push
npx prisma db seed
```

### Running Locally

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🐳 Docker Deployment

To spin up the entire application, including the database and web app, run:

```bash
docker-compose up --build
```

This will:
1. Spin up a **PostgreSQL 16** container.
2. Build and run the **Next.js** application.
3. Expose the web application at [http://localhost:3000](http://localhost:3000).

---

## 🧪 Running Tests

To execute tests and verify functionality:
```bash
./run-tests.ps1
```
*(On non-Windows systems, check the contents of `run-tests.ps1` to run the equivalent npm commands).*

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

# Todos

- [ ] Add team collaboration
- [ ] Add recurring tasks
- [ ] Add reminder notifications
- [ ] Add user settings
- [ ] Add timeline view