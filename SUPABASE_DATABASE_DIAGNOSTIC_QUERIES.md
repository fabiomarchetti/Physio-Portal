# 🔍 SUPABASE DATABASE DIAGNOSTIC QUERIES
## 📅 Data: 9 Agosto 2025
## 🚨 File di Emergenza per Diagnostica Database

---

## 🎯 **SCOPO DEL FILE**
Questo file contiene tutte le query SQL necessarie per diagnosticare problemi del database Supabase del progetto **Physio Portal**.

**USO**: Quando ci sono errori 400 Bad Request o problemi di connessione, esegui queste query per identificare il problema.

---

## 🗄️ **STRUTTURA DATABASE VERIFICATA**

### **Tabella: `categorie_esercizi`**
```sql
-- Struttura colonne
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'categorie_esercizi'
ORDER BY ordinal_position;
```

**Risultato atteso**:
```json
[
  {"column_name": "id", "data_type": "integer", "is_nullable": "NO"},
  {"column_name": "nome_categoria", "data_type": "text", "is_nullable": "NO"},
  {"column_name": "img_categoria", "data_type": "text", "is_nullable": "NO"},
  {"column_name": "data_creazione", "data_type": "timestamp with time zone", "is_nullable": "YES"},
  {"column_name": "data_aggiornamento", "data_type": "timestamp with time zone", "is_nullable": "YES"}
]
```

### **Tabella: `esercizi`**
```sql
-- Struttura colonne
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'esercizi'
ORDER BY ordinal_position;
```

**Risultato atteso**:
```json
[
  {"column_name": "id_esercizio", "data_type": "integer", "is_nullable": "NO"},
  {"column_name": "id_categoria", "data_type": "integer", "is_nullable": "NO"},
  {"column_name": "nome_esercizio", "data_type": "text", "is_nullable": "NO"},
  {"column_name": "img_esercizio", "data_type": "text", "is_nullable": "YES"},
  {"column_name": "descrizione_esecuzione", "data_type": "text", "is_nullable": "NO"},
  {"column_name": "note", "data_type": "text", "is_nullable": "YES"},
  {"column_name": "landmark", "data_type": "ARRAY", "is_nullable": "YES"}
]
```

---

## 🔗 **RELAZIONI TRA TABELLE**

### **Foreign Keys**
```sql
-- Verifica relazioni
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('esercizi', 'categorie_esercizi');
```

**Risultato atteso**:
```json
[
  {
    "table_name": "esercizi",
    "column_name": "id_categoria",
    "foreign_table_name": "categorie_esercizi",
    "foreign_column_name": "id"
  }
]
```

---

## 🧪 **QUERY DI TEST PER DIAGNOSTICA**

### **1. Test Connessione Base**
```sql
-- Verifica se le tabelle esistono e sono accessibili
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name IN ('categorie_esercizi', 'esercizi');
```

### **2. Test Dati Esistenti**
```sql
-- Conta righe in categorie_esercizi
SELECT COUNT(*) as totale_categorie FROM categorie_esercizi;

-- Conta righe in esercizi
SELECT COUNT(*) as totale_esercizi FROM esercizi;
```

### **3. Test Query Semplici**
```sql
-- Test tabella categorie_esercizi
SELECT * FROM categorie_esercizi LIMIT 3;

-- Test tabella esercizi
SELECT * FROM esercizi LIMIT 3;
```

### **4. Test Relazioni**
```sql
-- Verifica se esistono esercizi per categoria specifica
SELECT 
  e.id_esercizio,
  e.nome_esercizio,
  c.nome_categoria
FROM esercizi e
JOIN categorie_esercizi c ON e.id_categoria = c.id
LIMIT 5;
```

---

## 🚨 **PROBLEMI COMUNI E SOLUZIONI**

### **Errore 400 Bad Request**
**Sintomi**: Query fallisce con status 400
**Cause possibili**:
1. ❌ **Colonna inesistente** nel SELECT
2. ❌ **Tipo di dato sbagliato** nel filtro
3. ❌ **Sintassi JOIN non supportata** da Supabase

**Soluzione**:
```sql
-- Usa query semplice senza JOIN
SELECT * FROM esercizi WHERE id_categoria = 12;
```

### **Errore di Connessione**
**Sintomi**: Timeout o errore di rete
**Cause possibili**:
1. ❌ **Variabili d'ambiente** non configurate
2. ❌ **Token di autenticazione** scaduto
3. ❌ **Problemi di rete**

**Soluzione**:
- Verifica `.env.local`
- Riautentica l'utente
- Controlla la connessione internet

---

## 🔧 **INTERFACCE TYPESCRIPT CORRETTE**

### **CategoriaEsercizio**
```typescript
interface CategoriaEsercizio {
  id: number
  nome_categoria: string
  img_categoria: string
  data_creazione: string
  data_aggiornamento: string
}
```

### **Esercizio**
```typescript
interface Esercizio {
  id_esercizio: number        // ✅ Nome colonna reale
  id_categoria: number        // ✅ Foreign key
  nome_esercizio: string      // ✅ Nome esercizio
  img_esercizio?: string      // ✅ Immagine opzionale
  descrizione_esecuzione: string // ✅ Descrizione
  note?: string               // ✅ Note opzionali
  landmark?: string[]         // ✅ Array landmarks
}
```

---

## 📱 **COME ACCEDERE AL SUPABASE DASHBOARD**

1. **Vai a**: https://supabase.com/dashboard
2. **Login** con le tue credenziali
3. **Seleziona progetto**: `icvkdkgaygmsweeiqgxw`
4. **Vai a**: `SQL Editor` (menu laterale sinistro)
5. **Esegui le query** sopra elencate

---

## 🎯 **CHECKLIST DIAGNOSTICA RAPIDA**

Quando ci sono problemi:

- [ ] **Esegui query struttura tabelle** (vedi sopra)
- [ ] **Verifica relazioni** (foreign keys)
- [ ] **Testa query semplici** senza JOIN
- [ ] **Controlla interfacce TypeScript** per corrispondenza
- [ ] **Verifica variabili d'ambiente** Supabase
- [ ] **Controlla autenticazione** utente

---

## 📞 **CONTATTI EMERGENZA**

- **File**: `SUPABASE_DATABASE_DIAGNOSTIC_QUERIES.md`
- **Data creazione**: 9 Agosto 2025
- **Progetto**: Physio Portal
- **Database**: Supabase PostgreSQL

---

## 🔄 **AGGIORNAMENTI**

**Versione**: 1.0
**Ultimo aggiornamento**: 9 Agosto 2025
**Stato**: ✅ Completato e verificato

---

*Questo file è stato creato per risolvere problemi di connessione e query al database Supabase. Mantienilo aggiornato con eventuali modifiche alla struttura del database.*
