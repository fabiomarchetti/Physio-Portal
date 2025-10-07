# Database Neon - Physio Portal

Questa cartella contiene tutti gli script SQL necessari per configurare il database PostgreSQL su Neon.tech per l'applicazione Physio Portal.

## 📋 Contenuto

- `01_extensions.sql` - Estensioni PostgreSQL necessarie (uuid-ossp, pgcrypto)
- `02_tables.sql` - Creazione di tutte le tabelle del database
- `03_indexes.sql` - Indici per ottimizzazione delle performance
- `04_functions_triggers.sql` - Funzioni helper e trigger automatici
- `05_auth_helpers.sql` - Funzioni per autenticazione e gestione utenti

## 🚀 Installazione

### 1. Crea un database su Neon.tech

1. Vai su [neon.tech](https://neon.tech) e crea un nuovo progetto
2. Copia la stringa di connessione PostgreSQL

### 2. Esegui gli script nell'ordine

**IMPORTANTE:** Gli script devono essere eseguiti nell'ordine numerico (01, 02, 03, 04, 05)

#### Opzione A: Usando psql (command line)

```bash
# Sostituisci con la tua connection string di Neon
export DATABASE_URL="postgresql://username:password@hostname/database"

# Esegui gli script nell'ordine
psql $DATABASE_URL -f 01_extensions.sql
psql $DATABASE_URL -f 02_tables.sql
psql $DATABASE_URL -f 03_indexes.sql
psql $DATABASE_URL -f 04_functions_triggers.sql
psql $DATABASE_URL -f 05_auth_helpers.sql
```

#### Opzione B: Usando l'interfaccia SQL di Neon

1. Accedi al tuo progetto Neon
2. Vai nella sezione "SQL Editor"
3. Copia e incolla il contenuto di ogni file nell'ordine:
   - Copia tutto il contenuto di `01_extensions.sql` ed esegui
   - Copia tutto il contenuto di `02_tables.sql` ed esegui
   - Copia tutto il contenuto di `03_indexes.sql` ed esegui
   - Copia tutto il contenuto di `04_functions_triggers.sql` ed esegui
   - Copia tutto il contenuto di `05_auth_helpers.sql` ed esegui

### 3. Configura le variabili d'ambiente

Aggiorna il file `.env.local` nella root del progetto:

```env
# Rimuovi o commenta le vecchie variabili Supabase
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Aggiungi la connection string di Neon
DATABASE_URL="postgresql://username:password@hostname/database"
```

## 📊 Schema Database

### Tabelle Principali

1. **profili** - Profili utente base con ruolo (fisioterapista/paziente)
2. **fisioterapisti** - Informazioni professionali dei fisioterapisti
3. **pazienti** - Informazioni pazienti in carico
4. **tipi_esercizio** - Catalogo esercizi riabilitativi
5. **sessioni_riabilitazione** - Sessioni eseguite dai pazienti
6. **dati_movimento** - Dati raw MediaPipe (landmarks 33 punti)
7. **metriche_sessione** - Metriche calcolate (ROM, velocità, fluidità)
8. **obiettivi_terapeutici** - Obiettivi assegnati ai pazienti
9. **configurazioni_sistema** - Configurazioni globali

### Relazioni Principali

```
profili (1) ─── (1) fisioterapisti
profili (1) ─── (1) pazienti
fisioterapisti (1) ─── (N) pazienti
pazienti (1) ─── (N) sessioni_riabilitazione
sessioni_riabilitazione (1) ─── (N) dati_movimento
sessioni_riabilitazione (1) ─── (N) metriche_sessione
pazienti (1) ─── (N) obiettivi_terapeutici
```

## 🔐 Sistema di Autenticazione

A differenza di Supabase, Neon non ha un sistema di autenticazione integrato. L'autenticazione è gestita tramite funzioni SQL:

### Funzioni Disponibili

#### Registrazione
- `registra_fisioterapista(...)` - Registra un nuovo fisioterapista
- `registra_paziente(...)` - Registra un paziente (da parte del fisioterapista)

#### Login
- `login_fisioterapista(email, password)` - Login fisioterapista con email
- `login_paziente(codice_fiscale, password)` - Login paziente con CF

#### Gestione Password
- `cambia_password(profilo_id, vecchia_password, nuova_password)` - Cambio password
- `reset_password_paziente(fisioterapista_id, paziente_id)` - Reset password paziente
- `hash_password(password)` - Crea hash bcrypt della password
- `verifica_password(password, hash)` - Verifica password

#### Utility
- `get_profilo_completo(profilo_id)` - Ottieni profilo completo con dati ruolo
- `get_statistiche_paziente(paziente_id)` - Statistiche sessioni paziente
- `fisioterapista_ha_accesso_paziente(fisio_id, paziente_id)` - Verifica permessi

### Password Default Pazienti

I pazienti vengono creati con password auto-generata:
- Password = prime 5 lettere del codice fiscale in minuscolo
- Esempio: CF `RSSMRA80A01H501U` → password `rssmr`

## 🔧 Funzioni Helper Disponibili

### Statistiche e Metriche
```sql
-- Statistiche paziente
SELECT * FROM get_statistiche_paziente('uuid-paziente');

-- Metriche sessione per tipo
SELECT * FROM get_metriche_per_tipo('uuid-sessione', 'angolo_articolare');

-- Sessioni recenti
SELECT * FROM get_sessioni_recenti('uuid-paziente', 10);
```

### Gestione Utenti
```sql
-- Registra fisioterapista
SELECT * FROM registra_fisioterapista(
  'Mario', 'Rossi', 'mario.rossi@email.com', 'password123',
  'ALB12345', 'Fisioterapia sportiva', 'Clinica Salute',
  'Via Roma 1, Milano', '0212345678', 'info@clinica.it'
);

-- Registra paziente
SELECT * FROM registra_paziente(
  'uuid-fisioterapista',
  'Luca', 'Bianchi', '1980-01-01', 'RSSMRA80A01H501U',
  'Tendinite spalla', 'Esercizi ROM spalla', '3331234567', 'Note varie'
);
```

## 🔄 Migrazione da Supabase

### Differenze Principali

1. **Autenticazione**: Neon non ha auth integrata, usa le funzioni SQL fornite
2. **RLS (Row Level Security)**: Non supportata nativamente, implementa controlli a livello applicativo
3. **Real-time**: Non disponibile, considera polling o WebSocket custom
4. **Storage**: Non disponibile, usa servizio esterno (S3, Cloudinary, etc.)

### Modifiche Necessarie al Codice

Dovrai aggiornare i file:

1. **src/lib/supabase/client.ts** - Sostituisci client Supabase con client PostgreSQL
2. **src/lib/supabase/auth.ts** - Usa le funzioni SQL per autenticazione
3. **src/lib/supabase/queries.ts** - Aggiorna query usando client PostgreSQL

Esempio di modifica:

```typescript
// Prima (Supabase)
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, key)

// Dopo (Neon con pg o Prisma)
import { Pool } from 'pg'
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
```

## 📝 Note Importanti

1. **Backup**: Neon offre backup automatici, ma considera backup manuali periodici
2. **Connection Pooling**: Usa Prisma o pg-pool per gestire le connessioni
3. **Migrations**: Considera l'uso di Prisma Migrate o Drizzle per gestire le migrazioni future
4. **Sicurezza**: Le password sono hashate con bcrypt (salt rounds = 10)
5. **Trigger**: I trigger aggiornano automaticamente `data_aggiornamento` e `durata_minuti`

## 🐛 Troubleshooting

### Errore: "extension uuid-ossp does not exist"
Assicurati di eseguire `01_extensions.sql` per primo

### Errore: "function hash_password does not exist"
Esegui `04_functions_triggers.sql` e `05_auth_helpers.sql`

### Errore di connessione
Verifica che la connection string di Neon sia corretta e che il database sia attivo

## 📚 Risorse Utili

- [Documentazione Neon](https://neon.tech/docs)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [Trigger PostgreSQL](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [Bcrypt per Node.js](https://www.npmjs.com/package/bcrypt)

## 🆘 Supporto

Per problemi o domande:
1. Controlla i log di Neon nella dashboard
2. Verifica che tutti gli script siano stati eseguiti correttamente
3. Testa le funzioni SQL direttamente nell'editor SQL di Neon


Neon è compatibile con PostgreSQL, quindi la migrazione sarà abbastanza diretta. L'unica differenza principale è che Neon non
  ha il sistema di autenticazione integrato di Supabase, quindi dovrai gestire l'autenticazione a livello applicativo.

⏺ Bash(mkdir -p database_neon)
  ⎿  (No content)

⏺ Write(database_neon/01_extensions.sql)
  ⎿  Wrote 12 lines to database_neon/01_extensions.sql                
     -- =====================================================
     -- ESTENSIONI POSTGRESQL
     -- =====================================================
     -- Questo script abilita le estensioni necessarie per il database
     -- Da eseguire come primo script
     -- Estensione per UUID
     CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
     -- Estensione per funzioni crittografiche (per hash password)
     … +2 lines (ctrl+o to expand)

⏺ Write(database_neon/02_tables.sql)
  ⎿  Wrote 197 lines to database_neon/02_tables.sql                            
     -- =====================================================
     -- CREAZIONE TABELLE DATABASE PHYSIO-PORTAL
     -- =====================================================
     -- Script per la creazione di tutte le tabelle del sistema di fisioterapia
     -- Basato sullo schema definito in src/types/database.ts
     -- =====================================================
     -- TABELLA: profili
     -- Descrizione: Profili utente base con ruolo (fisioterapista/paziente)
     -- =====================================================
     … +187 lines (ctrl+o to expand)

⏺ Write(database_neon/03_indexes.sql)
  ⎿  Wrote 102 lines to database_neon/03_indexes.sql                  
     -- =====================================================
     -- INDICI PER OTTIMIZZAZIONE PERFORMANCE
     -- =====================================================
     -- Script per la creazione di indici sulle colonne più utilizzate
     -- =====================================================
     -- INDICI TABELLA: profili
     -- =====================================================
     CREATE INDEX IF NOT EXISTS idx_profili_email ON profili(email);
     CREATE INDEX IF NOT EXISTS idx_profili_ruolo ON profili(ruolo);
     … +92 lines (ctrl+o to expand)

⏺ Write(database_neon/04_functions_triggers.sql)
  ⎿  Wrote 276 lines to database_neon/04_functions_triggers.sql
     -- =====================================================
     -- FUNZIONI E TRIGGER
     -- =====================================================
     -- Script per funzioni helper e trigger automatici
     -- =====================================================
     -- FUNZIONE: Aggiornamento automatico timestamp
     -- =====================================================
     CREATE OR REPLACE FUNCTION update_updated_at_column()
     RETURNS TRIGGER AS $$
     … +266 lines (ctrl+o to expand)

⏺ Write(database_neon/05_auth_helpers.sql)
  ⎿  Wrote 420 lines to database_neon/05_auth_helpers.sql                                
     -- =====================================================
     -- FUNZIONI DI AUTENTICAZIONE E GESTIONE UTENTI
     -- =====================================================
     -- Script per funzioni di login, registrazione e gestione utenti
     -- NOTA: A differenza di Supabase, Neon richiede gestione auth a livello applicativo
     -- =====================================================
     -- FUNZIONE: Registrazione fisioterapista
     -- =====================================================
     CREATE OR REPLACE FUNCTION registra_fisioterapista(
     … +410 lines (ctrl+o to expand)

⏺ Write(database_neon/README.md)
  ⎿  Wrote 211 lines to database_neon/README.md                                                                                 
     # Database Neon - Physio Portal
     Questa cartella contiene tutti gli script SQL necessari per configurare il database PostgreSQL su Neon.tech per
     l'applicazione Physio Portal.
     ## 📋 Contenuto
     - `01_extensions.sql` - Estensioni PostgreSQL necessarie (uuid-ossp, pgcrypto)
     - `02_tables.sql` - Creazione di tutte le tabelle del database
     - `03_indexes.sql` - Indici per ottimizzazione delle performance
     - `04_functions_triggers.sql` - Funzioni helper e trigger automatici
     … +201 lines (ctrl+o to expand)

⏺ Write(database_neon/00_setup_completo.sql)
  ⎿  Wrote 337 lines to database_neon/00_setup_completo.sql              
     -- =====================================================
     -- SETUP COMPLETO DATABASE NEON - PHYSIO PORTAL
     -- =====================================================
     -- Questo file esegue l'intero setup del database in un unico script
     -- Alternativa all'esecuzione dei singoli file numerati
     --
     -- ATTENZIONE: Esegui questo script solo su un database vuoto!
     -- =====================================================
     -- =====================================================
     … +327 lines (ctrl+o to expand)

⏺ Bash(ls -lah database_neon/)
  ⎿  total 160                                         
     drwxr-xr-x  10 fabio  staff   320B  3 Ott 23:18 .
     drwxr-xr-x@ 30 fabio  staff   960B  3 Ott 22:15 ..
     … +8 lines (ctrl+o to expand)

⏺ Perfetto! Ho completato la creazione di tutti gli script SQL necessari per Neon. Ecco il riepilogo:

  ✅ Script Creati nella Cartella database_neon/

  Script Principali (da eseguire in ordine):

  1. 00_setup_completo.sql (12 KB) - Setup completo tutto-in-uno
  2. 01_extensions.sql (412 B) - Estensioni PostgreSQL (uuid-ossp, pgcrypto)
  3. 02_tables.sql (9.4 KB) - Tutte le 9 tabelle del sistema
  4. 03_indexes.sql (5.8 KB) - Indici per performance
  5. 04_functions_triggers.sql (8.6 KB) - Funzioni helper e trigger
  6. 05_auth_helpers.sql (12 KB) - Funzioni di autenticazione
  7. README.md (7.3 KB) - Documentazione completa

  📊 Cosa È Stato Ricreato:

  Tabelle (9 in totale):

  - ✅ profili - Profili utente base
  - ✅ fisioterapisti - Dati professionali fisioterapisti
  - ✅ pazienti - Pazienti in carico
  - ✅ tipi_esercizio - Catalogo esercizi
  - ✅ sessioni_riabilitazione - Sessioni eseguite
  - ✅ dati_movimento - Dati raw MediaPipe (JSONB)
  - ✅ metriche_sessione - Metriche calcolate
  - ✅ obiettivi_terapeutici - Obiettivi terapeutici
  - ✅ configurazioni_sistema - Config globali

  Funzionalità:

  - ✅ Hash password con bcrypt
  - ✅ Funzioni di registrazione/login
  - ✅ Trigger automatici (timestamp, durata sessioni)
  - ✅ Indici GIN per ricerca JSONB
  - ✅ Validazione codice fiscale
  - ✅ Generazione password pazienti da CF

  🚀 Prossimi Passi:

  1. Esegui gli script su Neon:
    - Opzione A: Usa 00_setup_completo.sql (tutto in uno)
    - Opzione B: Esegui 01→05 in ordine numerico
  2. Aggiorna variabili d'ambiente:
  DATABASE_URL="postgresql://user:pass@host/db"
  3. Aggiorna il codice:
    - Sostituisci client Supabase con client PostgreSQL (pg, Prisma, Drizzle)
    - Usa funzioni SQL per auth invece di Supabase Auth
    - Implementa gestione sessioni JWT lato app

  ⚠️ Differenze Chiave da Supabase:

  - No Row Level Security (RLS) → Controlli a livello applicativo
  - No Auth integrata → Usa funzioni SQL fornite
  - No Realtime → Implementa polling o WebSocket custom
  - No Storage → Usa servizio esterno (S3, Cloudinary)

  La tua soluzione è corretta: ricreare tutto su Neon è il modo migliore per procedere dato che non hai più accesso a Supabase!
  🎯
