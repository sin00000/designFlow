# DesignFlow

A complete design workflow platform — from inspiration to portfolio. Built with Next.js 14, TypeScript, TailwindCSS, Prisma, and NextAuth.js.

## Features

- **References** — Collect and organize design inspiration (Pinterest-style masonry grid)
- **Projects** — Manage design projects with Kanban/Calendar views, tasks, and progress tracking
- **Community** — Share work anonymously, get star ratings and comments from other designers
- **Portfolio** — Showcase completed work with a public shareable portfolio page
- **Workflow** — Seamless flow: References → Project → Community Feedback → Portfolio

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth.js (Email/Password + Google OAuth)
- **State**: Zustand + TanStack Query
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **PWA**: next-pwa

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google OAuth credentials (optional)

### Installation

1. **Clone and install dependencies**
   ```bash
   cd dr_wep
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Fill in the required values in `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/drwep"
   NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
   NEXTAUTH_URL="http://localhost:3000"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

3. **Set up the database**
   ```bash
   npm run db:generate   # Generate Prisma client
   npm run db:push       # Push schema to database
   ```

4. **Generate PWA icons**
   ```bash
   # Install pwa-asset-generator and generate icons
   npm install -g pwa-asset-generator
   npx pwa-asset-generator your-logo.svg ./public/icons
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
dr_wep/
├── app/
│   ├── (auth)/           # Login + Register pages
│   ├── (dashboard)/      # Protected dashboard pages
│   │   ├── page.tsx      # Home dashboard
│   │   ├── references/   # References management
│   │   ├── projects/     # Projects + detail
│   │   ├── community/    # Community feed + posts
│   │   └── portfolio/    # Portfolio management
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth + register
│   │   ├── references/   # CRUD references
│   │   ├── projects/     # CRUD projects + tasks
│   │   ├── community/    # Community posts, ratings, comments
│   │   ├── portfolio/    # CRUD portfolio items
│   │   ├── upload/       # Image uploads
│   │   └── dashboard/    # Dashboard stats
│   ├── p/[username]/     # Public portfolio pages
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── ui/               # Reusable UI components
│   ├── cards/            # Card components
│   ├── navigation/       # Nav components
│   └── workflow/         # Workflow banner
├── lib/
│   ├── auth.ts           # NextAuth config
│   ├── db.ts             # Prisma client
│   ├── utils.ts          # Utility functions
│   └── hooks/            # Custom hooks
├── prisma/
│   └── schema.prisma     # Database schema
├── store/
│   └── useAppStore.ts    # Zustand store
└── types/
    └── index.ts          # TypeScript types
```

## Database Schema

Key models:
- **User** — Authentication + profile
- **Reference** — Saved design inspiration images
- **Project** — Design projects with tasks, progress, status
- **Task** — Project subtasks with priorities
- **WorkImage** — Work-in-progress uploads per project
- **CommunityPost** — Shared work with anonymous option
- **Rating** — Star ratings (1-5) on community posts
- **Comment** — Comments on community posts
- **Portfolio** — Portfolio items with public sharing

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/references` | List/create references |
| GET/PUT/DELETE | `/api/references/[id]` | Single reference operations |
| GET/POST | `/api/projects` | List/create projects |
| GET/PUT/DELETE | `/api/projects/[id]` | Single project operations |
| GET/POST/PATCH | `/api/projects/[id]/tasks` | Project tasks |
| POST/DELETE | `/api/projects/[id]/work-images` | Work progress images |
| GET/POST | `/api/community` | Community feed/create post |
| GET/DELETE | `/api/community/[id]` | Single post |
| GET/POST | `/api/community/[id]/ratings` | Star ratings |
| GET/POST/DELETE | `/api/community/[id]/comments` | Comments |
| GET/POST | `/api/portfolio` | Portfolio items |
| GET/PUT/DELETE | `/api/portfolio/[id]` | Single portfolio item |
| POST | `/api/upload` | Image upload |
| GET | `/api/dashboard` | Dashboard stats |

## PWA Support

The app is a fully installable PWA:
- Offline support via service worker (next-pwa)
- Install prompt on mobile
- App manifest with icons
- Standalone display mode

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | NextAuth JWT secret |
| `NEXTAUTH_URL` | Yes | App URL for NextAuth |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL |

## License

MIT
