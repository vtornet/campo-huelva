# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Campo Huelva is an agricultural employment platform connecting workers, foremen (manijeros), and companies in the Spanish agricultural sector. It's built with Next.js 16, React 19, Firebase Authentication, PostgreSQL (via Prisma), and Tailwind CSS.

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint

# Database operations (after schema changes)
npx prisma generate
npx prisma db push
```

## Architecture

### Dual Authentication System
The app uses Firebase Auth for frontend authentication with a PostgreSQL database for persistent user data. The Firebase UID (`user.uid`) is the primary key in the database.

- **Firebase**: Handles authentication state, sign in/out via `src/lib/firebase.ts`
- **Prisma/PostgreSQL**: Stores user profiles, posts, applications, and connections
- **Sync**: When users register via `/api/register`, their Firebase UID is stored as the User.id in Prisma

### User Roles
There are three user roles (defined in `prisma/schema.prisma`):
- **USER** (Trabajador): Individual workers seeking employment
- **FOREMAN** (Manijero): Crew leaders with their own teams
- **COMPANY** (Empresa): Agricultural companies hiring workers

Each role has a dedicated profile table: `WorkerProfile`, `ForemanProfile`, `CompanyProfile`.

### Key Data Models

**Post System** (formerly Offer, renamed to be more generic):
- `PostType.OFFICIAL`: Verified company offers
- `PostType.SHARED`: User-shared offers seen elsewhere
- `PostType.DEMAND`: Workers/foremen seeking work

**Profile Resolution Logic**: The `/api/user/me` endpoint implements intelligent fallback - if a user's role doesn't match their existing profile, it returns the profile that actually exists with the corrected role. This prevents UI errors from role/profile mismatches.

### Application Structure

- `src/app/`: Next.js App Router pages
  - `page.tsx`: Main dashboard with feed filtering by province and post type
  - `login/`: Firebase authentication
  - `onboarding/`: Role selection for new users
  - `profile/worker/`, `profile/foreman/`: Profile editing forms
  - `publish/`: Post creation with type selection
- `src/app/api/`: API routes
  - `register/`: Creates user in Prisma from Firebase auth
  - `user/me/`: Returns user data with profile resolution
  - `posts/`: Feed retrieval (GET) and post creation (POST)
- `src/context/AuthContext.tsx`: Provides auth state via `useAuth()` hook
- `src/lib/constants.ts`: Province lists, crop types, towns in Huelva

### Important Patterns

**Profile Completion Check**: In `page.tsx`, users are redirected to onboarding if their profile lacks a name (`fullName` or `companyName`). This is enforced before showing the dashboard.

**Post Author Association**: When creating posts, the API automatically associates the correct publisher:
- Companies → `companyId` + type = OFFICIAL
- Workers/Foremen → `publisherId` + type = SHARED or DEMAND

**Color Coding by Role**:
- Workers: Green theme (`bg-green-*`, `text-green-*`)
- Foremen: Orange theme (`bg-orange-*`, `text-orange-*`)
- Companies: Blue theme (less used, green dominates)

### Environment Variables Required

For Firebase (public):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

For Database (private):
- `DATABASE_URL`: PostgreSQL connection string

## Language Rules

- All explanations, reasoning, and responses must be in Spanish.
- Code comments should be written in Spanish unless the file already uses English.
- Terminal output may be in English, but explanations must always be in Spanish.

## Change Policy

- Do not modify authentication logic (Firebase) without explicit confirmation.
- Do not change user roles or role resolution logic without discussion.
- Do not modify Prisma schema without explaining migration impact.
- Prefer small, incremental changes.
- Explain proposed changes before applying them.
- Ask before introducing new dependencies.
## Product Vision

The goal is to build a reliable, sector-focused employment and professional network
for agriculture in Spain, prioritizing:

- Real job offers and demands
- Verified and role-based user profiles
- Simplicity and usability over generic social features
- Scalability at national level

- Trust between workers, foremen, and companies

Avoid generic social-network patterns that do not add value to the agricultural sector.

## Project Status

This project is under active development.
Backward compatibility is not guaranteed yet, but breaking changes should still be discussed.
