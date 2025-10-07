# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks and fix issues

## Architecture Overview

This is a physiotherapy portal built with **Next.js 15**, **TypeScript**, **Supabase**, and **MediaPipe** for pose detection and motion analysis. The application serves two main user types: physiotherapists and patients with role-based authentication and dashboards.

### Key Technologies
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript (strict mode)
- **UI Components**: shadcn/ui with Radix UI primitives, Lucide React icons
- **Backend**: Supabase (authentication, PostgreSQL database, real-time subscriptions)
- **Computer Vision**: MediaPipe Pose (@mediapipe/tasks-vision) for 33-point body tracking
- **Styling**: Tailwind CSS v4 with CSS variables, next-themes for dark mode
- **State Management**: React hooks with custom providers and context
- **Notifications**: Sonner for toast notifications

### Database Schema (Supabase)
The PostgreSQL database contains these main entities:
- `profili` - User profiles with roles (fisioterapista/paziente)
- `fisioterapisti` - Physiotherapist professional details (numero_albo, specializzazione, clinica info)
- `pazienti` - Patient records linked to physiotherapists via foreign keys
- `sessioni_riabilitazione` - Rehabilitation sessions with states (attiva/completata/annullata)
- `dati_movimento` - Raw motion data from MediaPipe (punti_corpo, punti_mani, punti_pose as JSONB)
- `metriche_sessione` - Calculated motion metrics (ROM, velocity, fluidity, precision)
- `tipi_esercizio` - Exercise types with MediaPipe configurations stored as JSONB
- `obiettivi_terapeutici` - Therapeutic goals with progress tracking
- `configurazioni_sistema` - System-wide configuration settings

### Directory Structure
```
src/
├── app/ - Next.js App Router pages and layouts
│   ├── dashboard/ - Role-based dashboards (fisioterapista/paziente)
│   ├── login/ - Authentication pages
│   └── sessione/ - Session execution pages
├── components/
│   ├── computer-vision/ - MediaPipe pose detection components
│   ├── session/ - Session management components
│   ├── shared/ - Common components (AuthWrapper, Navbar)
│   └── ui/ - shadcn/ui components
├── hooks/ - Custom React hooks (useAuth, useSessionRecording)
├── lib/
│   ├── supabase/ - Database client and queries
│   ├── computer-vision/ - Motion metrics calculations
│   └── utils/ - Utility functions
└── types/ - TypeScript type definitions
```

### Authentication System
- **Dual Authentication**: Email/password for physiotherapists, codice fiscale + auto-generated password for patients  
- **Role-Based Access**: Supabase RLS policies enforce fisioterapista/paziente permissions
- **Protected Routes**: AuthWrapper component handles route protection and redirects
- **Patient Management**: Physiotherapists create patient accounts with auto-generated credentials (first 5 letters of codice fiscale in lowercase)
- **Session Management**: Custom useAuth hook manages authentication state

### Computer Vision System
- **MediaPipe Pose**: 33 landmark detection for full body tracking (face, torso, arms, legs)
- **LandmarkSelector**: Interactive anatomical diagram tool for creating custom exercises by selecting body points
- **Motion Metrics Calculation**: Real-time computation of ROM, velocity, fluidity, and symmetry metrics
- **Real-time Processing**: WebcamCapture component with pose overlay visualization
- **SessionController**: Manages recording workflow and data persistence to Supabase
- **Data Storage**: Motion data stored as JSONB with timestamps and confidence scores

### Key Components
- **LandmarkSelector**: Interactive anatomical diagram for exercise creation (`src/components/computer-vision/LandmarkSelector.tsx`)
- **PoseDetection**: Core MediaPipe pose detection with real-time visualization (`src/components/computer-vision/PoseDetection.tsx`)
- **SessionController**: Session recording workflow management (`src/components/computer-vision/SessionController.tsx`)
- **AuthWrapper**: Route protection and role-based access control (`src/components/shared/AuthWrapper.tsx`)
- **Role-Based Dashboards**: Separate dashboard views for physiotherapists (`app/dashboard/fisioterapista/`) and patients (`app/dashboard/paziente/`)

### Development Notes
- **TypeScript Configuration**: Strict mode enabled with path aliases (`@/*` → `./src/*`)
- **Supabase SSR**: Configured for server-side rendering with separate browser/server clients
- **MediaPipe Integration**: Landmark configurations stored in database as JSONB for exercise definitions
- **Data Persistence**: All motion data timestamped and linked to rehabilitation sessions with real-time updates
- **Component Architecture**: Uses shadcn/ui components with consistent styling patterns

### Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### MediaPipe Integration Details
- **Landmark System**: 33 body landmarks (0-32) covering face, torso, arms, and legs with 3D coordinates (x, y, z) and visibility scores
- **Key Landmarks**: Defined constants in `src/lib/computer-vision/motion-metrics.ts` (NOSE: 0, LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12, etc.)
- **Exercise Creation**: LandmarkSelector maps landmarks to anatomical diagram for visual exercise creation
- **Metrics Calculation**: Real-time computation of Range of Motion (ROM), velocity, stability, and symmetry metrics
- **Data Flow**: Raw pose data → motion metrics calculation → database storage → progress tracking visualization

### Important File Locations
- **Database Types**: Complete schema definitions in `src/types/database.ts`
- **Motion Metrics**: Pose landmark calculations in `src/lib/computer-vision/motion-metrics.ts`
- **Supabase Client**: Database interactions in `src/lib/supabase/` (client.ts, server.ts, queries.ts, auth.ts)
- **Authentication Logic**: Custom hooks in `src/hooks/useAuth.ts` and utility functions in `src/lib/utils/codice-fiscale.ts`
- **Session Management**: Recording logic in `src/hooks/useSessionRecording.ts` and `src/lib/supabase/session-service.ts`