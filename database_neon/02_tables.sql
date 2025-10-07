-- =====================================================
-- CREAZIONE TABELLE DATABASE PHYSIO-PORTAL
-- =====================================================
-- Script per la creazione di tutte le tabelle del sistema di fisioterapia
-- Basato sullo schema definito in src/types/database.ts

-- =====================================================
-- TABELLA: profili
-- Descrizione: Profili utente base con ruolo (fisioterapista/paziente)
-- =====================================================
CREATE TABLE IF NOT EXISTS profili (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ruolo VARCHAR(20) NOT NULL CHECK (ruolo IN ('fisioterapista', 'paziente')),
  nome VARCHAR(100) NOT NULL,
  cognome VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  data_creazione TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_aggiornamento TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Commenti sulla tabella
COMMENT ON TABLE profili IS 'Profili utente del sistema con informazioni base e ruolo';
COMMENT ON COLUMN profili.ruolo IS 'Ruolo utente: fisioterapista o paziente';
COMMENT ON COLUMN profili.email IS 'Email per login fisioterapisti, opzionale per pazienti';
COMMENT ON COLUMN profili.password_hash IS 'Hash della password (bcrypt o simile)';

-- =====================================================
-- TABELLA: fisioterapisti
-- Descrizione: Informazioni professionali dei fisioterapisti
-- =====================================================
CREATE TABLE IF NOT EXISTS fisioterapisti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profilo_id UUID NOT NULL UNIQUE REFERENCES profili(id) ON DELETE CASCADE,
  numero_albo VARCHAR(50) NOT NULL UNIQUE,
  specializzazione VARCHAR(200) NOT NULL,
  nome_clinica VARCHAR(200) NOT NULL,
  indirizzo_clinica TEXT NOT NULL,
  telefono VARCHAR(20),
  email_clinica VARCHAR(255),
  data_creazione TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE fisioterapisti IS 'Informazioni professionali dei fisioterapisti registrati';
COMMENT ON COLUMN fisioterapisti.profilo_id IS 'Riferimento al profilo utente';
COMMENT ON COLUMN fisioterapisti.numero_albo IS 'Numero albo professionale (univoco)';

-- =====================================================
-- TABELLA: pazienti
-- Descrizione: Informazioni sui pazienti in carico ai fisioterapisti
-- =====================================================
CREATE TABLE IF NOT EXISTS pazienti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profilo_id UUID NOT NULL UNIQUE REFERENCES profili(id) ON DELETE CASCADE,
  fisioterapista_id UUID NOT NULL REFERENCES fisioterapisti(id) ON DELETE RESTRICT,
  nome_paziente VARCHAR(100) NOT NULL,
  cognome_paziente VARCHAR(100) NOT NULL,
  data_nascita DATE NOT NULL,
  codice_fiscale VARCHAR(16) UNIQUE,
  telefono VARCHAR(20),
  diagnosi TEXT NOT NULL,
  piano_terapeutico TEXT NOT NULL,
  note TEXT,
  attivo BOOLEAN NOT NULL DEFAULT TRUE,
  data_creazione TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE pazienti IS 'Pazienti in carico ai fisioterapisti con informazioni cliniche';
COMMENT ON COLUMN pazienti.fisioterapista_id IS 'Fisioterapista responsabile del paziente';
COMMENT ON COLUMN pazienti.codice_fiscale IS 'Codice fiscale utilizzato per login paziente';
COMMENT ON COLUMN pazienti.attivo IS 'Indica se il paziente è attualmente in carico';

-- =====================================================
-- TABELLA: tipi_esercizio
-- Descrizione: Catalogo tipologie di esercizi riabilitativi
-- =====================================================
CREATE TABLE IF NOT EXISTS tipi_esercizio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_esercizio VARCHAR(200) NOT NULL,
  descrizione TEXT NOT NULL,
  istruzioni TEXT NOT NULL,
  durata_consigliata_minuti INTEGER,
  difficolta VARCHAR(20) NOT NULL DEFAULT 'medio' CHECK (difficolta IN ('facile', 'medio', 'difficile')),
  parti_corpo_coinvolte TEXT[] NOT NULL DEFAULT '{}',
  configurazione_mediapipe JSONB,
  attivo BOOLEAN NOT NULL DEFAULT TRUE,
  data_creazione TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tipi_esercizio IS 'Catalogo delle tipologie di esercizi disponibili';
COMMENT ON COLUMN tipi_esercizio.parti_corpo_coinvolte IS 'Array di parti del corpo coinvolte (es. ["spalla", "gomito"])';
COMMENT ON COLUMN tipi_esercizio.configurazione_mediapipe IS 'Configurazione JSON per MediaPipe (landmarks, soglie, etc.)';

-- =====================================================
-- TABELLA: sessioni_riabilitazione
-- Descrizione: Sessioni di esercizi eseguite dai pazienti
-- =====================================================
CREATE TABLE IF NOT EXISTS sessioni_riabilitazione (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paziente_id UUID NOT NULL REFERENCES pazienti(id) ON DELETE CASCADE,
  data_inizio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_fine TIMESTAMPTZ,
  durata_minuti INTEGER,
  tipo_esercizio VARCHAR(200) NOT NULL,
  obiettivi TEXT,
  note TEXT NOT NULL DEFAULT '',
  stato VARCHAR(20) NOT NULL DEFAULT 'attiva' CHECK (stato IN ('attiva', 'completata', 'annullata')),
  punteggio_finale DECIMAL(5,2),
  data_creazione TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sessioni_riabilitazione IS 'Sessioni di riabilitazione eseguite dai pazienti';
COMMENT ON COLUMN sessioni_riabilitazione.stato IS 'Stato della sessione: attiva, completata o annullata';
COMMENT ON COLUMN sessioni_riabilitazione.punteggio_finale IS 'Punteggio finale della sessione (0-100)';

-- =====================================================
-- TABELLA: dati_movimento
-- Descrizione: Dati raw dei movimenti catturati da MediaPipe
-- =====================================================
CREATE TABLE IF NOT EXISTS dati_movimento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sessione_id UUID NOT NULL REFERENCES sessioni_riabilitazione(id) ON DELETE CASCADE,
  timestamp_rilevamento TIMESTAMPTZ NOT NULL,
  punti_corpo JSONB NOT NULL DEFAULT '{}',
  punti_mani JSONB NOT NULL DEFAULT '{}',
  punti_pose JSONB NOT NULL DEFAULT '{}',
  frame_numero INTEGER,
  confidenza_rilevamento DECIMAL(5,4),
  data_creazione TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE dati_movimento IS 'Dati raw dei landmark MediaPipe catturati durante le sessioni';
COMMENT ON COLUMN dati_movimento.punti_corpo IS 'Landmarks corpo (33 punti MediaPipe Pose) in formato JSON';
COMMENT ON COLUMN dati_movimento.punti_mani IS 'Landmarks mani (21 punti per mano) in formato JSON';
COMMENT ON COLUMN dati_movimento.punti_pose IS 'Landmarks pose completi in formato JSON';
COMMENT ON COLUMN dati_movimento.confidenza_rilevamento IS 'Livello di confidenza del rilevamento (0-1)';

-- =====================================================
-- TABELLA: metriche_sessione
-- Descrizione: Metriche calcolate dai dati di movimento
-- =====================================================
CREATE TABLE IF NOT EXISTS metriche_sessione (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sessione_id UUID NOT NULL REFERENCES sessioni_riabilitazione(id) ON DELETE CASCADE,
  tipo_metrica VARCHAR(50) NOT NULL,
  valore_metrica DECIMAL(10,4) NOT NULL,
  unita_misura VARCHAR(20) NOT NULL,
  articolazione VARCHAR(50),
  timestamp_calcolo TIMESTAMPTZ NOT NULL,
  data_creazione TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE metriche_sessione IS 'Metriche calcolate dai dati di movimento (ROM, velocità, fluidità, etc.)';
COMMENT ON COLUMN metriche_sessione.tipo_metrica IS 'Tipo di metrica: angolo_articolare, velocita, range_movimento, fluidita, precisione';
COMMENT ON COLUMN metriche_sessione.articolazione IS 'Articolazione specifica (es. spalla_dx, gomito_sx)';

-- =====================================================
-- TABELLA: obiettivi_terapeutici
-- Descrizione: Obiettivi terapeutici assegnati ai pazienti
-- =====================================================
CREATE TABLE IF NOT EXISTS obiettivi_terapeutici (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paziente_id UUID NOT NULL REFERENCES pazienti(id) ON DELETE CASCADE,
  titolo_obiettivo VARCHAR(200) NOT NULL,
  descrizione TEXT NOT NULL,
  tipo_obiettivo VARCHAR(100) NOT NULL,
  valore_target DECIMAL(10,2),
  unita_misura VARCHAR(20),
  data_scadenza DATE,
  stato VARCHAR(20) NOT NULL DEFAULT 'attivo' CHECK (stato IN ('attivo', 'raggiunto', 'sospeso')),
  note_progresso TEXT,
  data_creazione TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE obiettivi_terapeutici IS 'Obiettivi terapeutici definiti per i pazienti';
COMMENT ON COLUMN obiettivi_terapeutici.valore_target IS 'Valore obiettivo da raggiungere (es. 90 gradi ROM)';
COMMENT ON COLUMN obiettivi_terapeutici.stato IS 'Stato obiettivo: attivo, raggiunto o sospeso';

-- =====================================================
-- TABELLA: configurazioni_sistema
-- Descrizione: Configurazioni globali del sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS configurazioni_sistema (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_configurazione VARCHAR(100) NOT NULL UNIQUE,
  valore_configurazione JSONB NOT NULL,
  descrizione TEXT,
  categoria VARCHAR(50) NOT NULL,
  modificabile_da VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (modificabile_da IN ('admin', 'fisioterapista', 'paziente', 'tutti')),
  data_creazione TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_aggiornamento TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE configurazioni_sistema IS 'Configurazioni globali del sistema';
COMMENT ON COLUMN configurazioni_sistema.valore_configurazione IS 'Valore della configurazione in formato JSON';
COMMENT ON COLUMN configurazioni_sistema.modificabile_da IS 'Chi può modificare questa configurazione';
