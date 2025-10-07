# 🔌 Integrazione Neon Database con VS Code

## 📋 Opzioni di Integrazione

Ci sono **3 modi principali** per integrare Neon in Visual Studio Code:

---

## 1️⃣ **PostgreSQL Extension (Consigliato)**

### Installa Extension
1. Apri VS Code
2. Vai su Extensions (Cmd+Shift+X su Mac, Ctrl+Shift+X su Windows)
3. Cerca: **"PostgreSQL" by Chris Kolkman**
4. Clicca "Install"

### Configura Connessione
1. Apri Command Palette (Cmd+Shift+P / Ctrl+Shift+P)
2. Cerca: `PostgreSQL: New Connection`
3. Inserisci i dati:

```
Host: ep-late-hat-agds7l6c-pooler.c-2.eu-central-1.aws.neon.tech
Port: 5432
User: neondb_owner
Password: npg_iW8cmdSs4hNM
Database: medingroup
SSL: enabled
```

### Utilizzo
- Esplora tabelle dalla sidebar
- Esegui query SQL direttamente
- Visualizza risultati in tabella
- Esporta dati in CSV/JSON

---

## 2️⃣ **Database Client Extension (Alternativa Completa)**

### Installa "Database Client"
1. Cerca: **"Database Client" by cweijan**
2. Install
3. Clicca icona database nella sidebar sinistra

### Configura
1. Clicca "+" per nuova connessione
2. Seleziona: **PostgreSQL**
3. Inserisci:

```
Name: Neon Physio Portal
Host: ep-late-hat-agds7l6c-pooler.c-2.eu-central-1.aws.neon.tech
Port: 5432
Username: neondb_owner
Password: npg_iW8cmdSs4hNM
Database: medingroup
SSL: On
```

### Funzionalità Extra
- ✅ Auto-complete SQL
- ✅ Visualizzazione ERD (Entity Relationship Diagram)
- ✅ Export/Import data
- ✅ Query history
- ✅ Multiple database support

---

## 3️⃣ **Neon CLI (Command Line)**

### Installa Neon CLI
```bash
npm install -g neonctl
```

### Login
```bash
neonctl auth
```

### Comandi Utili
```bash
# Lista progetti
neonctl projects list

# Connetti al database
neonctl connection-string --project-id shy-scene-61243876

# Esegui query
neonctl sql --project-id shy-scene-61243876 "SELECT * FROM profili LIMIT 5"

# Crea branch database (per dev/test)
neonctl branches create --project-id shy-scene-61243876 --name dev
```

---

## 4️⃣ **psql (PostgreSQL CLI nativa)**

### Connetti via psql
```bash
psql "postgresql://neondb_owner:npg_iW8cmdSs4hNM@ep-late-hat-agds7l6c-pooler.c-2.eu-central-1.aws.neon.tech/medingroup?sslmode=require"
```

### Comandi psql Utili
```sql
-- Lista tabelle
\dt

-- Descrivi tabella
\d profili

-- Esegui script
\i database_neon/06_aggiungi_ruolo_sviluppatore.sql

-- Esporta risultati
\o output.txt
SELECT * FROM profili;
\o

-- Quit
\q
```

---

## 🎯 **Configurazione Raccomandata**

### Per Sviluppo Quotidiano
1. **Database Client Extension** per:
   - Esplorare schema
   - Eseguire query veloci
   - Visualizzare dati
   - Export/Import

2. **psql** per:
   - Eseguire script SQL
   - Migrazioni
   - Operazioni bulk

3. **Neon CLI** per:
   - Gestione progetti
   - Branching database
   - Monitoraggio

---

## 📝 VS Code Settings (Opzionale)

Aggiungi al tuo `.vscode/settings.json`:

```json
{
  "sqltools.connections": [
    {
      "name": "Neon Physio Portal",
      "driver": "PostgreSQL",
      "server": "ep-late-hat-agds7l6c-pooler.c-2.eu-central-1.aws.neon.tech",
      "port": 5432,
      "database": "medingroup",
      "username": "neondb_owner",
      "password": "npg_iW8cmdSs4hNM",
      "connectionTimeout": 30,
      "ssl": true
    }
  ],
  "sqltools.useNodeRuntime": true
}
```

Poi installa: **"SQLTools" + "SQLTools PostgreSQL Driver"**

---

## 🔒 Sicurezza

### Non Committare Credenziali!
Aggiungi a `.gitignore`:
```
.vscode/settings.json
database_neon/accesso.md
*.env.local
```

### Usa Variabili d'Ambiente
Invece di hardcodare password in settings, usa:
```bash
# Nel terminale VS Code
export DATABASE_URL="postgresql://neondb_owner:..."
```

---

## 🚀 Quick Start

### 1. Installa Database Client Extension
```
Cmd+Shift+X → Cerca "Database Client" → Install
```

### 2. Aggiungi Connessione
- Clicca icona 🗄️ nella sidebar
- "+" → PostgreSQL
- Incolla i dati di connessione

### 3. Esplora Database
- Espandi medingroup
- Visualizza tabelle
- Clicca destro su tabella → "Select Top 1000"

### 4. Esegui Script
- Apri `06_aggiungi_ruolo_sviluppatore.sql`
- Clicca destro → "Run on Active Database"

---

## 📊 Verifica Installazione

### Test Connessione
```sql
SELECT
  current_database() as database,
  current_user as user,
  version() as postgres_version,
  NOW() as server_time;
```

### Verifica Utente Sviluppatore
```sql
SELECT
  p.nome,
  p.cognome,
  p.email,
  p.ruolo,
  s.azienda,
  s.permessi_speciali
FROM profili p
JOIN sviluppatori s ON s.profilo_id = p.id
WHERE p.email = 'marchettisoft@gmail.com';
```

---

## 💡 Tips

### Auto-Completion
Aggiungi estensione: **"SQL Language Server"**

### Format SQL
Aggiungi estensione: **"SQL Formatter"**
- Cmd+K Cmd+F per formattare

### Snippets Personalizzati
`.vscode/sql.code-snippets`:
```json
{
  "Select from profili": {
    "prefix": "sel-profili",
    "body": [
      "SELECT * FROM profili WHERE id = '${1:uuid}';"
    ]
  }
}
```

---

## 🆘 Troubleshooting

### Errore SSL
Se la connessione fallisce, aggiungi parametro SSL:
```
?sslmode=require
```

### Timeout Connessione
Aumenta timeout in settings:
```json
"connectionTimeout": 60
```

### Password Non Accettata
Verifica che la password sia esattamente:
```
npg_iW8cmdSs4hNM
```

---

## 📚 Risorse

- [Neon Docs](https://neon.tech/docs)
- [PostgreSQL Extension](https://marketplace.visualstudio.com/items?itemName=ckolkman.vscode-postgres)
- [Database Client](https://marketplace.visualstudio.com/items?itemName=cweijan.vscode-database-client2)
- [Neon CLI](https://neon.tech/docs/reference/neon-cli)
