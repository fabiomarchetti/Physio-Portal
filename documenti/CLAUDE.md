# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandi di Sviluppo

**Server di Sviluppo:**
```bash
npm run dev        # Avvia server di sviluppo su http://localhost:3000
npm run build      # Build per produzione
npm run start      # Avvia server di produzione
npm run lint       # Esegui ESLint per qualità del codice
```

**Testing:**
No testing framework is currently configured in package.json.

**Code Quality:**
```bash
npm run lint       # ESLint with Next.js configuration
```

## Architettura del Progetto

This is **Physio Portal** - a specialized system for **post-traumatic and orthopedic rehabilitation** following workplace injuries, compliant with Physio-Portal protocols. The system uses advanced computer vision (MediaPipe) to monitor patient movement during specific rehabilitation exercises outlined in the official manual "riabilitazione post-traumatica_e_ortopedica.pdf".

### Focus del Dominio Medico

**CONTESTO CRITICO:** Questa NON è un'applicazione di fisioterapia generica. È specificamente progettata per:
- Riabilitazione post-traumatica a seguito di infortuni sul lavoro
- Riabilitazione ortopedica secondo i protocolli medici Physio-Portal
- Riabilitazione cervicale, lombare, spalla, gomito, polso, anca, ginocchio e caviglia
- Esercizi evidence-based con ripetizioni, durate e linee guida di sicurezza specifiche
- Conformità ai requisiti del sistema sanitario italiano per il recupero da infortuni sul lavoro

L'applicazione implementa gli esercizi terapeutici e i protocolli dettagliati nel manuale Physio-Portal, trasformando la terapia tradizionale intermittente (2-3 sessioni/settimana) in riabilitazione continua 24/7 domiciliare sotto supervisione remota del fisioterapista.

### Stack Tecnologico
- **Framework:** Next.js 15.4.5 with App Router
- **Runtime:** React 19.1.0
- **Language:** TypeScript 5
- **Database:** Supabase (PostgreSQL with Row Level Security)  
- **Styling:** Tailwind CSS 4.0
- **UI Components:** shadcn/ui (Radix UI + custom styling)
- **Computer Vision:** MediaPipe (@mediapipe/tasks-vision)
- **Icons:** Lucide React

### Struttura Directory Principale

```
src/
├── app/                     # Next.js App Router pages
│   ├── login/              # Authentication pages
│   ├── register/           # User registration (fisioterapista/paziente)
│   ├── dashboard/          # User dashboards
│   ├── sessione/           # Therapy session management
│   └── test-*/            # Development test pages
├── components/
│   ├── computer-vision/    # MediaPipe pose detection & analysis
│   ├── session/           # Therapy session components
│   ├── shared/            # Shared components (AuthWrapper, Navbar)
│   ├── providers/         # React providers (ClientProvider)
│   └── ui/                # shadcn/ui base components
├── lib/
│   ├── supabase/          # Database integration & auth
│   ├── computer-vision/   # Motion metrics & calculations
│   └── utils.ts           # Tailwind utilities
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript definitions
```

### Schema Database (Supabase)

L'app utilizza uno schema PostgreSQL completo con queste entità chiave:
- `profili` - Base user profiles (fisioterapista/paziente roles)
- `fisioterapisti` - Physiotherapist-specific data
- `pazienti` - Patient-specific data  
- `sessioni_riabilitazione` - Therapy sessions
- `dati_movimento` - Real-time MediaPipe landmarks
- `metriche_sessione` - Calculated motion metrics
- `tipi_esercizio` - Exercise catalog
- `obiettivi_terapeutici` - Patient goals

Tutti i tipi sono completamente definiti in `src/types/database.ts`.

### Componenti Principali

**Computer Vision System (Physio-Portal Protocol-Compliant):**
- `PoseDetection.tsx` - Core MediaPipe integration with real-time pose detection optimized for rehabilitation exercises
- `LandmarkRenderer.tsx` - Renders pose landmarks on canvas with medical accuracy requirements
- `SessionController.tsx` - Manages therapy session recording with Physio-Portal protocol validation
- Motion metrics calculation in `lib/computer-vision/motion-metrics.ts` - calculates range of motion, movement quality, and compliance with therapeutic targets
- Specialized movement analysis for post-traumatic recovery patterns

**Authentication & Data:**
- Supabase client/server configuration in `lib/supabase/`  
- `AuthWrapper.tsx` - Handles authentication state
- Row Level Security policies protect user data

**Session Management:**
- `useSessionRecording` hook - Records therapy sessions with metrics
- Real-time pose data processing and database storage
- Session playback and analysis capabilities

### File di Configurazione

- `components.json` - shadcn/ui configuration (New York style, CSS variables)
- `tsconfig.json` - Path aliases configured (`@/*` → `./src/*`)
- `eslint.config.mjs` - Next.js + TypeScript linting
- `next.config.ts` - Next.js configuration (minimal)

### Note di Sviluppo Importanti

**Integrazione MediaPipe:**
- Utilizza `@mediapipe/tasks-vision` per il rilevamento della posa
- Ottimizzato per le performance con FPS e impostazioni di qualità configurabili
- Elaborazione landmarks in tempo reale con rendering throttled
- Accelerazione GPU abilitata quando disponibile

**Pattern Database:**
- Tutte le operazioni database utilizzano client Supabase tipizzati
- I componenti server usano `createServerClient()` da `lib/supabase/server.ts`
- I componenti client usano `createClient()` da `lib/supabase/client.ts`
- Tipi TypeScript completi in `types/database.ts`

**Pattern UI:**
- Componenti shadcn/ui con Tailwind CSS
- Design responsive con approccio mobile-first
- Interfaccia in lingua italiana
- Notifiche toast tramite Sonner

**Considerazioni sulle Performance:**
- Il rendering Canvas è throttled per mantenere video fluido
- Il rilevamento MediaPipe funziona a FPS configurabili (20-30 fps)
- Le scritture database sono raggruppate per i dati di movimento
- Rendering dei componenti ottimizzato con React.memo dove necessario

### Variabili d'Ambiente Richieste

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Stile del Codice e Pattern

- TypeScript strict mode abilitato
- Gli alias path usano il prefisso `@/` per la directory src
- Denominazione italiana nel testo UI ma inglese nel codice
- Componenti funzionali con pattern hooks
- Error boundaries e stati di loading gestiti
- Notifiche toast per feedback utente
- Hook personalizzati per gestione stato complesso:
  - `useSessionRecording` in `hooks/useSessionRecording.ts` - Manages therapy session recording with real-time metrics
  - `useScreenAdaptation` in `hooks/useScreenAdaptation.ts` - Handles responsive behavior for different screen sizes

### Sicurezza

- Supabase Row Level Security applicata
- Autenticazione richiesta per route protette
- Dati utente limitati per profile ID
- Nessun dato sensibile nel codice client-side
- Middleware CORS e autenticazione configurati

### Integrazione Protocolli Physio-Portal

**Categorie di Esercizi Supportate:**
- **Colonna Cervicale:** Esercizi di flessione, estensione, rotazione laterale secondo linee guida Physio-Portal
- **Complesso Spalla:** Riabilitazione con circonduzioni, elevazioni, rotazioni interna/esterna
- **Gomito e Polso:** Esercizi di ripristino mobilità post-traumatica
- **Colonna Lombare:** Protocolli specifici per recupero da lesioni dorsali lavorative
- **Anca e Ginocchio:** Esercizi di progressione in carico e mobilità
- **Caviglia e Piede:** Protocolli post-traumatici di propriocezione e forza

**Caratteristiche di Conformità Medica:**
- Tracciamento progressione esercizi secondo linee guida terapeutiche Physio-Portal
- Monitoraggio sicurezza con valutazione qualità movimento
- Metriche riabilitative quantificate per reporting medico
- Integrazione con requisiti documentazione sanitaria italiana
- Supervisione remota fisioterapista e validazione progressi

**Contesto di Mercato:**
- Trasforma mercato riabilitazione italiano da €2.8B da cure intermittenti a continue
- Indirizza 2.5 milioni di pazienti annuali con infortuni sul lavoro in Italia
- Abilita riabilitazione domiciliare 24/7 vs modello tradizionale 2-3 sessioni/settimana
- Prima piattaforma riabilitazione continua AI-powered sul mercato

Questa è un'applicazione medica altamente specializzata che richiede rigorosa aderenza ai protocolli terapeutici Physio-Portal, conformità privacy dei dati, performance real-time per accuratezza medica, e integrazione con i requisiti del sistema sanitario italiano per la riabilitazione da infortuni sul lavoro.

## Development Guidelines

**Key Architectural Patterns:**
- All database operations use typed Supabase clients with Row Level Security
- MediaPipe integration requires careful performance optimization (GPU acceleration, FPS throttling)
- Real-time pose data is processed and stored with batched database writes
- Italian UI text but English code/variable names throughout

**Critical Medical Application Requirements:**
- Maintain Physio-Portal protocol compliance in all rehabilitation features
- Ensure real-time performance for medical accuracy (20-30 FPS pose detection)
- Implement proper error handling for medical data integrity
- Follow Italian healthcare data privacy requirements

**Performance Considerations:**
- Canvas rendering is throttled to maintain smooth video
- MediaPipe pose detection optimized for configurable FPS
- Component rendering optimized with React.memo where needed
- Batch database writes for motion data to reduce load