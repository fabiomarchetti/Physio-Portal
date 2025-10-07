# 🚀 Esecuzione Setup Database Neon

## Metodo 1: Neon Console (Consigliato)

1. Vai su [Neon Console](https://console.neon.tech/)
2. Seleziona il progetto **medingroup**
3. Vai alla sezione **SQL Editor**
4. Esegui i file in ordine:

### Ordine di esecuzione:
```
1. 01_extensions.sql      - Estensioni (uuid, pgcrypto)
2. 02_tables.sql           - Tabelle database
3. 03_indexes.sql          - Indici per performance
4. 04_functions_triggers.sql - Funzioni utility e trigger
5. 05_auth_helpers.sql     - Funzioni di autenticazione ⭐
6. 06_aggiungi_ruolo_sviluppatore.sql - Crea account sviluppatore
```

**IMPORTANTE**: Il file **05_auth_helpers.sql** contiene:
- `registra_fisioterapista()` ← questa funzione manca!
- `registra_paziente()`
- `login_fisioterapista()`
- `login_paziente()`
- `cambia_password()`
- `get_profilo_completo()`

### Come eseguire un file:

1. Apri il file (es. `05_auth_helpers.sql`)
2. Copia tutto il contenuto
3. Incolla nel SQL Editor di Neon
4. Clicca **Run** o premi `Ctrl+Enter`
5. Verifica che non ci siano errori
6. Passa al file successivo

---

## Metodo 2: Setup Completo (Tutto in una volta)

Se preferisci eseguire tutto insieme:

1. Apri il file `00_setup_completo.sql`
2. Copia tutto il contenuto
3. Incolla nel SQL Editor di Neon
4. Esegui

**NOTA**: Questo file contiene tutti gli script uniti. Potrebbe richiedere qualche minuto.

---

## Metodo 3: Command Line con psql (Avanzato)

Se hai `psql` installato:

```bash
cd database_neon

# Connessione diretta
psql "postgresql://neondb_owner:npg_iW8cmdSs4hNM@ep-late-hat-agds7l6c-pooler.c-2.eu-central-1.aws.neon.tech/medingroup?sslmode=require"

# Esegui gli script
\i 01_extensions.sql
\i 02_tables.sql
\i 03_indexes.sql
\i 04_functions_triggers.sql
\i 05_auth_helpers.sql
\i 06_aggiungi_ruolo_sviluppatore.sql

# Esci
\q
```

---

## ✅ Verifica Setup

Dopo aver eseguito gli script, verifica che tutto sia stato creato:

```sql
-- Verifica funzioni di auth
SELECT proname
FROM pg_proc
WHERE proname LIKE '%fisioterapista%'
   OR proname LIKE '%paziente%'
   OR proname LIKE '%sviluppatore%';
```

Dovresti vedere:
- `registra_fisioterapista`
- `registra_paziente`
- `login_fisioterapista`
- `login_paziente`
- `login_sviluppatore`
- `get_profilo_completo`
- `cambia_password`

---

## 🐛 Risoluzione Problemi

### Errore: "extension pgcrypto already exists"
Non è un problema, significa che l'estensione è già installata. Continua con gli altri script.

### Errore: "function already exists"
Usa `CREATE OR REPLACE FUNCTION` oppure elimina prima la funzione:
```sql
DROP FUNCTION IF EXISTS registra_fisioterapista;
```

### Errore: "table already exists"
Le tabelle esistono già. Salta `02_tables.sql` e passa ai successivi.

---

## 🎯 Prossimo Passo

Dopo aver eseguito tutti gli script:

1. Torna all'applicazione
2. Ricarica la pagina
3. Fai login come sviluppatore
4. Prova a registrare un fisioterapista

Dovrebbe funzionare! 🚀
