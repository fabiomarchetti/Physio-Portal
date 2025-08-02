# 🏥 Physio Portal - Riassunto del Progetto

## 📋 Informazioni Generali

**Nome Progetto:** Physio Portal  
**Versione:** 0.1.0  
**Tipo:** Portale di Riabilitazione Motoria con Computer Vision  
**Framework:** Next.js 15.4.5 con React 19.1.0  
**Linguaggio:** TypeScript  
**Database:** Supabase  
**Styling:** Tailwind CSS 4.0  

## 🎯 Scopo del Progetto

Sistema innovativo per fisioterapisti e pazienti che utilizza l'intelligenza artificiale e computer vision (MediaPipe/OpenCV) per:
- Monitorare movimenti corporei in tempo reale
- Tracciare progressi nella riabilitazione motoria
- Gestire sessioni terapeutiche
- Fornire analytics avanzate sui risultati

## 🌳 Struttura del Progetto

```
physio-portal/
├── 📁 public/                          # Asset statici
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── 📁 src/                             # Codice sorgente principale
│   ├── 📁 app/                         # App Router di Next.js
│   │   ├── favicon.ico
│   │   ├── globals.css                 # Stili globali
│   │   ├── layout.tsx                  # Layout principale
│   │   ├── page.tsx                    # Homepage
│   │   ├── 📁 login/                   # Pagina di accesso
│   │   │   └── page.tsx
│   │   └── 📁 register/                # Registrazione utenti
│   │       ├── page.tsx
│   │       ├── 📁 fisioterapista/      # Registrazione fisioterapisti
│   │       └── 📁 paziente/            # Registrazione pazienti
│   │
│   ├── 📁 components/                  # Componenti React
│   │   ├── 📁 providers/               # Provider di contesto
│   │   │   └── ClientProvider.tsx      # Provider client-side
│   │   ├── 📁 shared/                  # Componenti condivisi
│   │   │   ├── AuthWrapper.tsx         # Wrapper autenticazione
│   │   │   └── Navbar.tsx              # Barra di navigazione
│   │   └── 📁 ui/                      # Componenti UI base
│   │       ├── avatar.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── input.tsx
│   │       └── label.tsx
│   │
│   ├── 📁 lib/                         # Librerie e utilità
│   │   ├── utils.ts                    # Funzioni di utilità
│   │   └── 📁 supabase/                # Integrazione Supabase
│   │       ├── auth.ts                 # Servizi autenticazione
│   │       ├── client.ts               # Client Supabase
│   │       ├── queries.ts              # Query database
│   │       └── server.ts               # Server-side Supabase
│   │
│   └── 📁 types/                       # Definizioni TypeScript
│       └── database.ts                 # Schema database completo
│
├── 📁 .vscode/                         # Configurazione VSCode
│   └── settings.json                   # Impostazioni editor
│
├── 📄 .gitignore                       # File da ignorare in Git
├── 📄 components.json                  # Configurazione componenti UI
├── 📄 eslint.config.mjs               # Configurazione ESLint
├── 📄 middleware.ts                    # Middleware Next.js
├── 📄 next.config.ts                  # Configurazione Next.js
├── 📄 package.json                    # Dipendenze e script
├── 📄 postcss.config.mjs              # Configurazione PostCSS
├── 📄 README.md                       # Documentazione base
├── 📄 SETUP_INSTRUCTIONS.md           # Istruzioni setup
├── 📄 tsconfig.json                   # Configurazione TypeScript
└── 📄 PROJECT_OVERVIEW.md             # Questo file
```

## 🗄️ Schema Database (Supabase)

### Tabelle Principali

#### 👤 **Gestione Utenti**
- `profili` - Profili base utenti (fisioterapisti/pazienti)
- `fisioterapisti` - Dati specifici fisioterapisti
- `pazienti` - Dati specifici pazienti

#### 🏃‍♂️ **Sessioni e Movimento**
- `sessioni_riabilitazione` - Sessioni terapeutiche
- `dati_movimento` - Dati MediaPipe in tempo reale
- `metriche_sessione` - Metriche calcolate per sessione

#### ⚙️ **Configurazione e Esercizi**
- `tipi_esercizio` - Catalogo esercizi disponibili
- `configurazioni_sistema` - Impostazioni sistema
- `obiettivi_terapeutici` - Obiettivi per pazienti

### Tipi di Dati Principali
- **Ruoli:** `fisioterapista` | `paziente`
- **Stati Sessione:** `attiva` | `completata` | `annullata`
- **Difficoltà:** `facile` | `medio` | `difficile`
- **Metriche:** `angolo_articolare` | `velocita` | `range_movimento` | `fluidita` | `precisione`

## 🛠️ Stack Tecnologico

### Frontend
- **Next.js 15.4.5** - Framework React con App Router
- **React 19.1.0** - Libreria UI
- **TypeScript 5** - Tipizzazione statica
- **Tailwind CSS 4.0** - Framework CSS utility-first
- **Lucide React** - Icone

### Backend & Database
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Database relazionale
- **Row Level Security** - Sicurezza a livello di riga

### Computer Vision
- **MediaPipe** - Rilevamento pose e movimenti
- **OpenCV** - Elaborazione video
- **Landmarks Detection** - Tracciamento punti corporei

### Development Tools
- **ESLint** - Linting codice
- **PostCSS** - Processore CSS
- **VSCode** - Editor configurato

## 🔧 Funzionalità Implementate

### ✅ **Completate**
- [x] Struttura base Next.js con App Router
- [x] Sistema di autenticazione con Supabase
- [x] Componenti UI base (Button, Card, Input, etc.)
- [x] Layout responsive con Navbar
- [x] Homepage con sezioni informative
- [x] Pagine di login e registrazione
- [x] Schema database completo
- [x] Tipizzazione TypeScript completa
- [x] Configurazione path alias (`@/`)
- [x] Risoluzione errori hydration
- [x] AuthWrapper per gestione stati utente

### 🚧 **In Sviluppo**
- [ ] Implementazione registrazione fisioterapisti
- [ ] Implementazione registrazione pazienti
- [ ] Dashboard fisioterapisti
- [ ] Dashboard pazienti
- [ ] Sistema sessioni riabilitazione
- [ ] Integrazione MediaPipe
- [ ] Analytics e metriche
- [ ] Sistema notifiche

## 🎨 Design System

### Colori Principali
- **Primario:** Blu (`blue-600`, `blue-50`)
- **Secondario:** Indaco (`indigo-100`)
- **Accenti:** Verde, Viola, Rosso per categorie
- **Neutri:** Grigi per testi e sfondi

### Componenti UI
- **Cards** - Per contenuti strutturati
- **Buttons** - Varianti primary, outline, secondary
- **Forms** - Input, Label con validazione
- **Navigation** - Navbar responsive
- **Loading** - Spinner animato

## 🔐 Sicurezza

### Autenticazione
- **Supabase Auth** - Gestione utenti
- **JWT Tokens** - Autenticazione stateless
- **Row Level Security** - Protezione dati database
- **Middleware** - Protezione route

### Validazione
- **TypeScript** - Type safety
- **Schema validation** - Validazione dati input
- **Sanitizzazione** - Pulizia dati utente

## 📱 Responsive Design

- **Mobile First** - Design ottimizzato per mobile
- **Breakpoints Tailwind** - sm, md, lg, xl
- **Grid System** - Layout flessibili
- **Touch Friendly** - Interfaccia touch-optimized

## 🚀 Performance

### Ottimizzazioni Next.js
- **App Router** - Routing ottimizzato
- **Server Components** - Rendering server-side
- **Image Optimization** - Ottimizzazione automatica immagini
- **Code Splitting** - Caricamento lazy dei componenti

### Bundle Size
- **Tree Shaking** - Eliminazione codice non utilizzato
- **Dynamic Imports** - Caricamento condizionale
- **Compression** - Compressione asset

## 🧪 Testing & Quality

### Code Quality
- **ESLint** - Linting automatico
- **TypeScript** - Controllo tipi statici
- **Prettier** - Formattazione codice consistente

### Browser Support
- **Modern Browsers** - Chrome, Firefox, Safari, Edge
- **ES2017+** - Supporto JavaScript moderno
- **WebRTC** - Per funzionalità camera

## 📦 Deployment

### Vercel (Raccomandato)
- **Zero Config** - Deploy automatico
- **Edge Functions** - Performance globali
- **Preview Deployments** - Anteprima PR

### Supabase
- **Managed Database** - PostgreSQL gestito
- **Edge Functions** - Serverless functions
- **Real-time** - Aggiornamenti in tempo reale

## 🔄 Workflow di Sviluppo

### Scripts Disponibili
```bash
npm run dev      # Sviluppo locale
npm run build    # Build produzione
npm run start    # Avvio produzione
npm run lint     # Controllo codice
```

### Git Workflow
- **Feature Branches** - Sviluppo per feature
- **Pull Requests** - Review codice
- **Conventional Commits** - Messaggi standardizzati

## 📈 Roadmap Futura

### Fase 1 - Core Features
- [ ] Completamento sistema registrazione
- [ ] Dashboard base per entrambi i ruoli
- [ ] Sistema sessioni base

### Fase 2 - Computer Vision
- [ ] Integrazione MediaPipe
- [ ] Rilevamento movimenti real-time
- [ ] Calcolo metriche base

### Fase 3 - Analytics
- [ ] Dashboard analytics avanzate
- [ ] Report automatici
- [ ] Esportazione dati

### Fase 4 - Mobile App
- [ ] App React Native
- [ ] Sincronizzazione offline
- [ ] Notifiche push

---

**Ultimo aggiornamento:** 2 Gennaio 2025  
**Stato:** In sviluppo attivo  
**Maintainer:** Team Physio Portal