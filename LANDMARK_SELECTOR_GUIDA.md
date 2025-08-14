# 🎯 Guida Completa - LandmarkSelector per Esercizi Fisioterapici

## 📋 **Panoramica del Componente**

Il `LandmarkSelector` è un componente React che permette ai fisioterapisti di configurare esercizi personalizzati selezionando i punti del corpo (landmarks) da monitorare durante la riabilitazione.

## 🖼️ **Caratteristiche Principali**

### **1. Interfaccia Visiva Intuitiva**
- **Immagine del corpo** con landmarks numerati (0-32)
- **Punti cliccabili** direttamente sull'immagine
- **Griglia alternativa** per selezione rapida
- **Colori categorizzati** per parti del corpo

### **2. Selezione Intelligente**
- **Clic diretto** sui landmarks dell'immagine
- **Filtri per categoria** (testa, tronco, braccia, gambe)
- **Vista selezionati** per focus sui punti scelti
- **Validazione** automatica della selezione

### **3. Configurazione Completa**
- **Form completo** per dettagli esercizio
- **Statistiche in tempo reale** della selezione
- **Salvataggio** con configurazione MediaPipe
- **Gestione errori** e feedback utente

## 🏗️ **Struttura Tecnica**

### **Landmarks MediaPipe (33 punti)**

#### **Testa (0-10)**
```
0: Naso                    - Centro testa
1: Occhio Destro Interno   - Angolo interno occhio destro
2: Occhio Destro           - Centro occhio destro
3: Occhio Destro Esterno   - Angolo esterno occhio destro
4: Occhio Sinistro Interno - Angolo interno occhio sinistro
5: Occhio Sinistro         - Centro occhio sinistro
6: Occhio Sinistro Esterno - Angolo esterno occhio sinistro
7: Orecchio Destro         - Orecchio destro
8: Orecchio Sinistro       - Orecchio sinistro
9: Bocca Destra            - Angolo destro della bocca
10: Bocca Sinistra         - Angolo sinistro della bocca
```

#### **Busto e Braccia (11-22)**
```
11: Spalla Destra          - Spalla destra
12: Spalla Sinistra        - Spalla sinistra
13: Gomito Destro          - Gomito destro
14: Gomito Sinistro        - Gomito sinistro
15: Polso Destro           - Polso destro
16: Polso Sinistro         - Polso sinistro
17: Base Pollice Destro    - Base pollice destro (vicino polso)
18: Base Pollice Sinistro  - Base pollice sinistro (vicino polso)
19: Punta Indice Destro    - Punta indice destro
20: Punta Indice Sinistro  - Punta indice sinistro
21: Punta Mignolo Destro   - Punta mignolo destro
22: Punta Mignolo Sinistro - Punta mignolo sinistro
```

#### **Bacino e Gambe (23-32)**
```
23: Anca Destra            - Anca destra
24: Anca Sinistra          - Anca sinistra
25: Ginocchio Destro       - Ginocchio destro
26: Ginocchio Sinistro     - Ginocchio sinistro
27: Caviglia Destra        - Caviglia destra
28: Caviglia Sinistra      - Caviglia sinistra
29: Tallone Destro         - Tallone destro
30: Tallone Sinistro       - Tallone sinistro
31: Punta Piede Destro     - Punta piede destro
32: Punta Piede Sinistro   - Punta piede sinistro
```

## 🎨 **Interfaccia Utente**

### **Layout Responsivo**
```
┌─────────────────────────────────────────────────────────┐
│                    Header                               │
│           Configuratore Esercizi Fisioterapici         │
└─────────────────────────────────────────────────────────┘
┌─────────────────┐ ┌─────────────────────────────────────┐
│                 │ │                                     │
│ Form            │ │ Immagine Corpo +                    │
│ Configurazione  │ │ Landmarks Cliccabili                │
│                 │ │                                     │
│ • Nome          │ │ • Punti rossi numerati              │
│ • Descrizione   │ │ • Clic diretto                      │
│ • Istruzioni    │ │ • Feedback visivo                   │
│ • Difficoltà    │ │                                     │
│ • Durata        │ └─────────────────────────────────────┘
│                 │ ┌─────────────────────────────────────┐
│ • Statistiche   │ │ Griglia Landmarks                   │
│ • Azioni        │ │ • Selezione alternativa             │
│                 │ │ • Filtri categoria                  │
└─────────────────┘ └─────────────────────────────────────┘
```

### **Colori e Categorizzazione**
- **🔵 Testa**: Blu (landmarks 0-10)
- **🟢 Tronco**: Verde (landmarks 11, 12, 23, 24)
- **🟠 Braccia**: Arancione (landmarks 13-22)
- **🟣 Gambe**: Viola (landmarks 25-32)

## 🚀 **Come Utilizzare**

### **1. Selezione Landmarks**
```typescript
// Clic diretto sull'immagine
// Ogni punto rosso è cliccabile
// Feedback visivo immediato (blu = selezionato)
```

### **2. Filtri e Categorie**
```typescript
// Dropdown per filtrare per parte del corpo
// Vista "Solo Selezionati" per focus
// Griglia alternativa per selezione rapida
```

### **3. Configurazione Esercizio**
```typescript
// Form completo per dettagli
// Validazione automatica
// Statistiche in tempo reale
```

## 💾 **Struttura Dati Output**

### **EsercizioConfigurato**
```typescript
interface EsercizioConfigurato {
  nome: string                                    // Nome esercizio
  descrizione: string                            // Descrizione breve
  istruzioni: string                             // Istruzioni dettagliate
  difficolta: 'facile' | 'medio' | 'difficile'  // Livello difficoltà
  durata_consigliata_minuti: number              // Durata consigliata
  landmarks_selezionati: number[]                // Array ID landmarks
  parti_corpo_coinvolte: string[]                // Parti corpo coinvolte
  configurazione_mediapipe: {                    // Config MediaPipe
    landmarks_target: number[]                    // Landmarks target
    soglia_confidenza: number                    // Soglia confidenza
    range_movimento_min: number                  // Range movimento min
    range_movimento_max: number                  // Range movimento max
  }
}
```

### **Esempio Output**
```typescript
{
  nome: "Flessione Gomito Destro",
  descrizione: "Esercizio per ripristinare mobilità gomito destro",
  istruzioni: "Flettere il gomito destro mantenendo la spalla ferma",
  difficolta: "medio",
  durata_consigliata_minuti: 15,
  landmarks_selezionati: [11, 13, 15],  // Spalla, gomito, polso destri
  parti_corpo_coinvolte: ["braccia"],
  configurazione_mediapipe: {
    landmarks_target: [11, 13, 15],
    soglia_confidenza: 0.7,
    range_movimento_min: 0,
    range_movimento_max: 150
  }
}
```

## 🔧 **Integrazione nel Sistema**

### **1. Import Componente**
```typescript
import { LandmarkSelector, type EsercizioConfigurato } from '@/components/computer-vision/LandmarkSelector'
```

### **2. Utilizzo Base**
```typescript
export default function CreaEsercizioPage() {
  const handleSave = (esercizio: EsercizioConfigurato) => {
    // Salva nel database
    // Naviga alla dashboard
    // Mostra conferma
  }

  return (
    <LandmarkSelector 
      onSave={handleSave}
      onCancel={() => router.back()}
    />
  )
}
```

### **3. Salvataggio Database**
```typescript
const saveEsercizio = async (esercizio: EsercizioConfigurato) => {
  const { data, error } = await supabase
    .from('tipi_esercizio')
    .insert({
      nome_esercizio: esercizio.nome,
      descrizione: esercizio.descrizione,
      istruzioni: esercizio.istruzioni,
      difficolta: esercizio.difficolta,
      durata_consigliata_minuti: esercizio.durata_consigliata_minuti,
      parti_corpo_coinvolte: esercizio.parti_corpo_coinvolte,
      configurazione_mediapipe: esercizio.configurazione_mediapipe
    })
  
  return { data, error }
}
```

## 🎯 **Casi d'Uso Comuni**

### **1. Esercizio Braccia**
- **Landmarks**: 11, 13, 15 (spalla, gomito, polso destri)
- **Monitoraggio**: Flessione/estensione gomito
- **Metriche**: Range di movimento, velocità

### **2. Esercizio Gambe**
- **Landmarks**: 23, 25, 27 (anca, ginocchio, caviglia destri)
- **Monitoraggio**: Squat, affondi
- **Metriche**: Profondità, stabilità

### **3. Esercizio Postura**
- **Landmarks**: 11, 12, 23, 24 (spalle e anche)
- **Monitoraggio**: Allineamento posturale
- **Metriche**: Simmetria, stabilità

## 🧪 **Testing e Debug**

### **Pagina di Test**
```
/src/app/test-landmark-selector/page.tsx
```

### **Console Logs**
```typescript
// Attiva console per vedere:
// - Selezione landmarks
// - Configurazione esercizio
// - Output finale
```

### **Validazione**
- Nome esercizio obbligatorio
- Almeno un landmark selezionato
- Feedback errori in tempo reale

## 🔮 **Miglioramenti Futuri**

### **Short-term**
- [ ] **Template predefiniti** per esercizi comuni
- [ ] **Salvataggio locale** per bozze
- [ ] **Import/Export** configurazioni

### **Long-term**
- [ ] **AI suggerimenti** per landmarks ottimali
- [ **Analisi movimento** in tempo reale
- [ ] **Integrazione EMR** per prescrizioni

## 📝 **Note di Sviluppo**

### **Dipendenze**
- `@/components/ui/*` - Componenti UI base
- `lucide-react` - Icone
- `sonner` - Toast notifications
- `next/image` - Ottimizzazione immagini

### **Performance**
- **Lazy loading** per immagine corpo
- **Memoization** per calcoli complessi
- **Debouncing** per input form

### **Accessibilità**
- **Keyboard navigation** per landmarks
- **Screen reader** support
- **High contrast** mode

---

**Versione**: 1.0.0  
**Data**: Gennaio 2025  
**Autore**: Team Physio Portal  
**Stato**: ✅ **COMPLETATO E TESTATO**
