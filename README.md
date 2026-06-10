# Jarvis — Task Manager

> A personal task management mobile app, **offline-first** and **AI-ready**. Capture tasks in less than 5 seconds, works 100% without network.

## 🎯 Vision & Principles

**Jarvis** is a personal task management application, mobile-first, focused on individual productivity. Inspired by Todoist, but built from day 1 with a **sync-ready** architecture and prepared for future integration of AI, OCR, and natural language commands.

### Product Principles

- ⚡ **Quick capture** — add tasks in less than 5 seconds
- 🚀 **Offline-first** — works 100% without network connection
- 🧠 **Low cognitive load** — clean and intuitive interface
- 👤 **Personal** — focused on individual productivity (not teams)
- 🔮 **Future-proof** — architecture ready for AI, OCR, and cloud sync

---

## ✨ Main Features

### Core (MVP)

- ✅ **Quick Add (Central FAB)** — add tasks with metadata: `#project` `!p1` `tomorrow` `@tag`
- 📅 **"Today" View** — tasks for today + overdue + inbox
- 🗓️ **Monthly Agenda** — interactive calendar with dots for dates with tasks
- 🔍 **Full-text Search** — search with filters (project, priority, date, tag)
- 📁 **Projects** — organize by project with colors and icons
- 🏷️ **Tags** — secondary task categorization
- ⏰ **Local Notifications** — scheduled reminders
- 🌙 **Auto + Manual Theme** — light/dark based on system or preference

### Upcoming Phases

- 🤖 **AI Assistant** — long press FAB for smart commands
- 📸 **OCR** — capture tasks from documents
- 🔄 **Cloud Sync** — work locally, sync to cloud
- ⏳ **Recurring Tasks** — tasks that repeat
- 🎯 **Subtasks** — decomposed tasks (1 level)

---

## 🛠️ Tech Stack

| Layer | Technology |
|--------|-----------|
| **Framework** | Expo SDK 55 + React 19 + React Native 0.83 |
| **Language** | TypeScript (strict mode) |
| **Routing** | Expo Router (`src/app/`) |
| **UI Components** | react-native-reusables (shadcn port) |
| **Styling** | NativeWind v4 (Tailwind on RN) |
| **Data State** | Hooks + TanStack Query pattern (lightweight) |
| **UI State** | Context API + custom `createStore` |
| **Database** | expo-sqlite + Drizzle ORM |
| **Forms** | React Hook Form + Zod |
| **Dates** | date-fns |
| **Calendar** | react-native-calendars |
| **Notifications** | expo-notifications |
| **Performant Lists** | @shopify/flash-list |
| **Gestures & Animations** | Reanimated 4 + Gesture Handler |
| **Icons** | Ionicons (via @expo/vector-icons) |
| **Testing** | Vitest + @testing-library/react-native |
| **Platform** | Android only (MVP) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│  UI Layer (Expo Router + Components)                    │
├─────────────────────────────────────────────────────────┤
│  State / Hooks (Context API + TanStack Query pattern)   │
├─────────────────────────────────────────────────────────┤
│  Domain Hooks (useTasks, useProjects, etc.)             │
├─────────────────────────────────────────────────────────┤
│  Repository Layer ← DATA BOUNDARY                       │
│  (tasks, projects, labels, reminders, outbox)           │
├─────────────────────────────────────────────────────────┤
│  Persistence (expo-sqlite + Drizzle ORM)                │
├─────────────────────────────────────────────────────────┤
│  Platform / Native (notif, gestures, file system)       │
└─────────────────────────────────────────────────────────┘
```

### Architectural Principles

- **Offline-first** — local database is the source of truth
- **Repositories as boundary** — UI never touches the DB directly
- **Sync-ready from day 1** — ULIDs, `clientUpdatedAt`, `syncStatus`, `outbox` table
- **Feature-sliced** — organization by functional domain

---

## 📁 Folder Structure

```
src/
├── app/                          # Expo Router (routes)
│   ├── _layout.tsx               # Root providers
│   ├── (tabs)/                   # Bottom tabs (5 tabs + central FAB)
│   │   ├── index.tsx             # Today
│   │   ├── agenda.tsx            # Agenda
│   │   ├── plus.tsx              # FAB (central tab, empty)
│   │   ├── search.tsx            # Search
│   │   └── projects.tsx          # Projects
│   ├── tasks/                    # Detail, create, edit
│   ├── projects/                 # Project detail, create, edit
│   └── (modals)/
│       ├── quick-add.tsx         # Quick Add modal
│       ├── task-picker.tsx       # Subtask picker
│       └── date-picker.tsx       # Date picker
│
├── components/
│   ├── ui/                       # shadcn-style (Button, Input, etc.)
│   ├── tasks/                    # TaskRow, TaskList, TaskForm
│   ├── projects/                 # ProjectCard, ProjectForm
│   └── shared/                   # EmptyState, Chips, etc.
│
├── db/
│   ├── client.ts                 # expo-sqlite + Drizzle init
│   ├── schema.ts                 # Tables + types
│   ├── migrations/               # Migration history
│   └── seed.ts                   # Dev seed
│
├── repositories/                 # DATA BOUNDARY
│   ├── tasks.repo.ts
│   ├── projects.repo.ts
│   ├── labels.repo.ts
│   ├── reminders.repo.ts
│   └── outbox.repo.ts
│
├── hooks/                        # Data fetching + UI state
│   ├── useTasks.ts
│   ├── useProjects.ts
│   ├── useTaskMutations.ts
│   └── useAgenda.ts
│
├── state/                        # Context-based stores
│   ├── theme.store.ts
│   ├── filters.store.ts
│   └── ui-prefs.context.tsx
│
├── styles/                       # Design system
│   ├── Colors.ts                 # Palette (light + dark)
│   ├── Typography.ts             # Fonts (Inter + SpaceMono)
│   └── reusables-adapter.ts      # Semantic tokens
│
├── schemas/                      # Zod (validation)
│   ├── task.schema.ts
│   └── project.schema.ts
│
├── types/                        # TypeScript definitions
├── lib/                          # Utils (cn, formatters)
├── i18n/                         # Internationalization (pt-PT, en-US)
└── constants/                    # Constants
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Android SDK (for `npm run android`)
- Expo CLI (installed via npm)

### Installation

```bash
# Clone and install dependencies
npm install

# Start dev server
npm start

# At QR Code, choose:
# - "a" for Android emulator/device
# - "w" for web (preview only)
# - Scan with Expo Go app for mobile
```

### Available Commands

```bash
# Development
npm start                 # Metro bundler with QR Code
npm run android          # Run on Android emulator/device
npm run web              # Web preview (incomplete in MVP)

# Linting & Tests
npm run lint             # ESLint
npm test                 # Vitest (unit tests)
npm run test:watch      # Vitest in watch mode

# Database
npm run db:migrate       # Apply migrations (Drizzle)
npm run db:seed          # Seed database with example data

# Build
npm run build            # Build for production (Android APK/AAB)
```

---

## 📊 Data Model

### Main Tables

- **users** — local user (1 per device)
- **tasks** — tasks (with support for priorities, dates, recurrence)
- **projects** — projects (groupers)
- **labels** — tags (secondary categorization)
- **task_labels** — M:N relation tasks ↔ tags
- **reminders** — scheduled reminders
- **outbox** — pending mutations for future sync

### Design Decisions

- **ULIDs** for IDs — orderable, generated on client, unique
- **Sync-ready** — `clientUpdatedAt`, `syncStatus` fields, `outbox` table
- **Soft delete** — `archivedAt` field in projects (no physical deletion)

---

## 🎨 Design System

### Color Palette

- **Primary** — `#dc4c3e` (red, Jarvis identity)
- **Secondary** — `#D88E2E` (orange)
- **Success** — `#2f9d23` (green)
- **Themes** — light/dark automatic support

### Typography

- **Inter** — primary font (Regular, Medium, Semibold, Bold)
- **SpaceMono** — decorative (timestamps, IDs, numbers)

Full details in [`src/styles/Colors.ts`](src/styles/Colors.ts).

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# With coverage
npm test -- --coverage
```

**Target coverage:** >80% in critical layers (repos, schemas, hooks).

---

## 🔄 Roadmap

### Phase 1 (Scaffolding) ✓ Scheduled

- ✅ Package setup (NativeWind, Drizzle, Expo Router, etc.)
- ✅ Providers and base UI
- ✅ DB schema + migrations
- ✅ Repositories + tests
- ✅ Quick Add (POC)
- ✅ Bottom tabs + FAB

### Phase 2 (Core Features)

- Complete "Today" view
- Calendar agenda
- Full-text search
- Project CRUD
- Tags
- Scheduled notifications
- Onboarding
- Settings + i18n

### Phase 3 (AI & Sync)

- AI Assistant (long press FAB)
- Document OCR
- Cloud synchronization
- Recurring tasks
- Subtasks (1 level)

### Phase 4+ (Polish)

- Custom themes
- Widgets
- System calendar integration
- Analytics & statistics

---

## 🔐 Security

- ✅ No secret hardcoding — use `.env` or Expo secrets
- ✅ Local data only (in MVP)
- ✅ Zod validation on all boundaries
- ✅ TypeScript strict mode

---

## 📝 Code Conventions

- **Components** — functional components with hooks
- **Imports** — grouped: built-ins → externals → internals → relatives
- **Types** — interfaces for objects, types for unions/intersections
- **Async** — use `async/await`, never callbacks
- **Strings** — pt-PT + en-US via `src/i18n/`
- **Linting** — `npm run lint` before commit

Details in [`AGENTS.md`](AGENTS.md).

---

## 📄 Documentation

- [`analise-do-produto.md`](analise-do-produto.md) — discovery, architecture, decisions
- [`AGENTS.md`](AGENTS.md) — agent instructions & workflow
- [`session-state.md`](session-state.md) — coding session state

---

## 📞 Support & Feedback

For questions or suggestions, check the documentation files above or open an issue.

---

**Made with ❤️ by Jarvis team** | Inspired by Todoist | Built with React Native + Expo
