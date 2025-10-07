# 🔐 Credenziali Database Neon - Physio Portal

## 📊 Informazioni Progetto

- **Project Name**: medingroup
- **Project ID**: shy-scene-61243876
- **Organization**: fabio
- **Organization ID**: org-jolly-tooth-76189574

---

## 🗄️ Connessione Database PostgreSQL

### Connection String Completa
```
DATABASE_URL='postgresql://neondb_owner:npg_iW8cmdSs4hNM@ep-late-hat-agds7l6c-pooler.c-2.eu-central-1.aws.neon.tech/medingroup?sslmode=require&channel_binding=require'
```

### Parametri Individuali

| Parametro | Valore |
|-----------|--------|
| **Host** | `ep-late-hat-agds7l6c-pooler.c-2.eu-central-1.aws.neon.tech` |
| **Port** | `5432` |
| **Database** | `medingroup` |
| **Username** | `neondb_owner` |
| **Password** | `npg_iW8cmdSs4hNM` |
| **SSL** | `require` |

---

## 🔐 Stack Auth Configuration

### Project Info
```
Stack Auth Project ID: 787dfffa-6ffb-4b48-80e3-21709c8fc639
JWKS URL: https://api.stack-auth.com/api/v1/projects/787dfffa-6ffb-4b48-80e3-21709c8fc639/.well-known/jwks.json
```

### Environment Variables
```env
NEXT_PUBLIC_STACK_PROJECT_ID='787dfffa-6ffb-4b48-80e3-21709c8fc639'
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY='pck_sy01459gggh4aznyzgpt2r4bqt97trgzd6xmcwh90wdyr'
STACK_SECRET_SERVER_KEY='ssk_wd00p1f0jhexq804hv38ngd9pb1a1tjqvq9gj4mty20k8'
```

---

## 👨‍💻 Account Sviluppatore

### Credenziali Login
```
Email:    marchettisoft@gmail.com
Password: Filohori11!
Ruolo:    sviluppatore
```

### Permessi
- ✅ gestione_utenti
- ✅ visualizza_tutti_pazienti
- ✅ gestione_esercizi
- ✅ backup_database

---

## 🔧 Utilizzo in Codice

### Next.js / Node.js
```typescript
// app/actions.ts
"use server";
import { neon } from "@neondatabase/serverless";

export async function getData() {
    const sql = neon(process.env.DATABASE_URL);
    const data = await sql`SELECT * FROM profili`;
    return data;
}
```

### .env.local
```env
# Database connection
DATABASE_URL='postgresql://neondb_owner:npg_iW8cmdSs4hNM@ep-late-hat-agds7l6c-pooler.c-2.eu-central-1.aws.neon.tech/medingroup?sslmode=require&channel_binding=require'

# Stack Auth
NEXT_PUBLIC_STACK_PROJECT_ID='787dfffa-6ffb-4b48-80e3-21709c8fc639'
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY='pck_sy01459gggh4aznyzgpt2r4bqt97trgzd6xmcwh90wdyr'
STACK_SECRET_SERVER_KEY='ssk_wd00p1f0jhexq804hv38ngd9pb1a1tjqvq9gj4mty20k8'

# JWT (se necessario per auth custom)
JWT_SECRET='physio-portal-secret-key-change-in-production-2024'
JWT_EXPIRES_IN='7d'
```

---

## 📡 REST API Endpoint (Opzionale)

```
https://ep-late-hat-agds7l6c.apirest.c-2.eu-central-1.aws.neon.tech/neondb/rest/v1
```

---

## 🔒 Sicurezza

⚠️ **IMPORTANTE**:
- NON committare questo file su repository pubblici
- Questo file è incluso in `.gitignore`
- Cambia `JWT_SECRET` in produzione
- Ruota le password periodicamente
- **Keep Neon credentials secure**: do not expose them to client-side code

---

## 📚 Risorse

- [Neon Dashboard](https://console.neon.tech/)
- [Documentazione Neon](https://neon.tech/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Stack Auth Docs](https://docs.stack-auth.com/)
