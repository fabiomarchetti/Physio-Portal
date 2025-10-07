-- =====================================================
-- SETUP COMPLETO DATABASE NEON - PHYSIO PORTAL
-- =====================================================
-- Questo file esegue l'intero setup del database in un unico script
-- Alternativa all'esecuzione dei singoli file numerati
--
-- ATTENZIONE: Esegui questo script solo su un database vuoto!
-- =====================================================

-- =====================================================
-- PARTE 1: ESTENSIONI
-- =====================================================
\echo '========================================='
\echo 'Installazione estensioni PostgreSQL...'
\echo '========================================='

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\echo 'Estensioni installate con successo!'

-- =====================================================
-- PARTE 2: TABELLE
-- =====================================================
\echo ''
\echo '========================================='
\echo 'Creazione tabelle...'
\echo '========================================='

-- Tabella: profili
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

-- Tabella: fisioterapisti
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

-- Tabella: pazienti
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

-- Tabella: tipi_esercizio
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

-- Tabella: sessioni_riabilitazione
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

-- Tabella: dati_movimento
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

-- Tabella: metriche_sessione
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

-- Tabella: obiettivi_terapeutici
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

-- Tabella: configurazioni_sistema
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

\echo 'Tabelle create con successo!'

-- =====================================================
-- PARTE 3: INDICI
-- =====================================================
\echo ''
\echo '========================================='
\echo 'Creazione indici...'
\echo '========================================='

-- Indici profili
CREATE INDEX IF NOT EXISTS idx_profili_email ON profili(email);
CREATE INDEX IF NOT EXISTS idx_profili_ruolo ON profili(ruolo);
CREATE INDEX IF NOT EXISTS idx_profili_cognome ON profili(cognome);

-- Indici fisioterapisti
CREATE INDEX IF NOT EXISTS idx_fisioterapisti_profilo_id ON fisioterapisti(profilo_id);
CREATE INDEX IF NOT EXISTS idx_fisioterapisti_numero_albo ON fisioterapisti(numero_albo);

-- Indici pazienti
CREATE INDEX IF NOT EXISTS idx_pazienti_profilo_id ON pazienti(profilo_id);
CREATE INDEX IF NOT EXISTS idx_pazienti_fisioterapista_id ON pazienti(fisioterapista_id);
CREATE INDEX IF NOT EXISTS idx_pazienti_codice_fiscale ON pazienti(codice_fiscale);
CREATE INDEX IF NOT EXISTS idx_pazienti_attivo ON pazienti(attivo);
CREATE INDEX IF NOT EXISTS idx_pazienti_fisioterapista_attivo ON pazienti(fisioterapista_id, attivo);

-- Indici tipi_esercizio
CREATE INDEX IF NOT EXISTS idx_tipi_esercizio_attivo ON tipi_esercizio(attivo);
CREATE INDEX IF NOT EXISTS idx_tipi_esercizio_difficolta ON tipi_esercizio(difficolta);
CREATE INDEX IF NOT EXISTS idx_tipi_esercizio_parti_corpo ON tipi_esercizio USING GIN(parti_corpo_coinvolte);
CREATE INDEX IF NOT EXISTS idx_tipi_esercizio_config_mediapipe ON tipi_esercizio USING GIN(configurazione_mediapipe);

-- Indici sessioni
CREATE INDEX IF NOT EXISTS idx_sessioni_paziente_id ON sessioni_riabilitazione(paziente_id);
CREATE INDEX IF NOT EXISTS idx_sessioni_stato ON sessioni_riabilitazione(stato);
CREATE INDEX IF NOT EXISTS idx_sessioni_data_inizio ON sessioni_riabilitazione(data_inizio DESC);
CREATE INDEX IF NOT EXISTS idx_sessioni_paziente_stato ON sessioni_riabilitazione(paziente_id, stato);

-- Indici dati movimento
CREATE INDEX IF NOT EXISTS idx_dati_movimento_sessione_id ON dati_movimento(sessione_id);
CREATE INDEX IF NOT EXISTS idx_dati_movimento_timestamp ON dati_movimento(timestamp_rilevamento);
CREATE INDEX IF NOT EXISTS idx_dati_movimento_punti_corpo ON dati_movimento USING GIN(punti_corpo);

-- Indici metriche
CREATE INDEX IF NOT EXISTS idx_metriche_sessione_id ON metriche_sessione(sessione_id);
CREATE INDEX IF NOT EXISTS idx_metriche_tipo ON metriche_sessione(tipo_metrica);

-- Indici obiettivi
CREATE INDEX IF NOT EXISTS idx_obiettivi_paziente_id ON obiettivi_terapeutici(paziente_id);
CREATE INDEX IF NOT EXISTS idx_obiettivi_stato ON obiettivi_terapeutici(stato);

\echo 'Indici creati con successo!'

-- =====================================================
-- PARTE 4: FUNZIONI E TRIGGER
-- =====================================================
\echo ''
\echo '========================================='
\echo 'Creazione funzioni e trigger...'
\echo '========================================='

-- Funzione aggiornamento timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_aggiornamento = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger timestamp
CREATE TRIGGER trigger_update_profili_timestamp
  BEFORE UPDATE ON profili
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_configurazioni_timestamp
  BEFORE UPDATE ON configurazioni_sistema
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Funzione calcolo durata
CREATE OR REPLACE FUNCTION calcola_durata_sessione()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.data_fine IS NOT NULL AND NEW.data_inizio IS NOT NULL THEN
    NEW.durata_minuti = EXTRACT(EPOCH FROM (NEW.data_fine - NEW.data_inizio)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcola_durata_sessione
  BEFORE INSERT OR UPDATE ON sessioni_riabilitazione
  FOR EACH ROW
  EXECUTE FUNCTION calcola_durata_sessione();

-- Funzioni helper
CREATE OR REPLACE FUNCTION hash_password(password VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION verifica_password(password VARCHAR, password_hash VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN password_hash = crypt(password, password_hash);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION valida_codice_fiscale(cf VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  IF LENGTH(cf) != 16 THEN RETURN FALSE; END IF;
  IF cf !~ '^[A-Z0-9]{16}$' THEN RETURN FALSE; END IF;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION genera_password_da_cf(cf VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
  RETURN LOWER(SUBSTRING(cf, 1, 5));
END;
$$ LANGUAGE plpgsql;

\echo 'Funzioni e trigger creati con successo!'

-- =====================================================
-- PARTE 5: FUNZIONI AUTENTICAZIONE (estratto)
-- =====================================================
\echo ''
\echo '========================================='
\echo 'Creazione funzioni autenticazione...'
\echo '========================================='

-- Per le funzioni complete di autenticazione, vedi 05_auth_helpers.sql
-- Qui includiamo solo le funzioni essenziali

CREATE OR REPLACE FUNCTION fisioterapista_ha_accesso_paziente(
  p_fisioterapista_id UUID,
  p_paziente_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  ha_accesso BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM pazienti p
    WHERE p.id = p_paziente_id AND p.fisioterapista_id = p_fisioterapista_id
  ) INTO ha_accesso;
  RETURN ha_accesso;
END;
$$ LANGUAGE plpgsql;

\echo 'Funzioni autenticazione create con successo!'

-- =====================================================
-- COMPLETAMENTO
-- =====================================================
\echo ''
\echo '========================================='
\echo 'Setup completato con successo!'
\echo '========================================='
\echo ''
\echo 'Tabelle create:'
\echo '  - profili'
\echo '  - fisioterapisti'
\echo '  - pazienti'
\echo '  - tipi_esercizio'
\echo '  - sessioni_riabilitazione'
\echo '  - dati_movimento'
\echo '  - metriche_sessione'
\echo '  - obiettivi_terapeutici'
\echo '  - configurazioni_sistema'
\echo ''
\echo 'Prossimi passi:'
\echo '  1. Configura DATABASE_URL nel file .env.local'
\echo '  2. Esegui 05_auth_helpers.sql per funzioni auth complete'
\echo '  3. Aggiorna il codice per usare Neon invece di Supabase'
\echo '  4. Testa la connessione e le funzioni di base'
\echo ''
