-- =====================================================
-- TABELLA: esercizi_pazienti (versione semplificata)
-- Assegnazione esercizi ai pazienti da parte dei fisioterapisti
-- =====================================================

-- Crea la tabella
CREATE TABLE IF NOT EXISTS esercizi_pazienti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paziente_id UUID NOT NULL REFERENCES pazienti(id) ON DELETE CASCADE,
  esercizio_id UUID NOT NULL REFERENCES tipi_esercizio(id) ON DELETE CASCADE,
  fisioterapista_id UUID NOT NULL REFERENCES fisioterapisti(id) ON DELETE CASCADE,

  -- Pianificazione
  data_assegnazione TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_inizio DATE,
  data_fine DATE,
  frequenza_settimanale INTEGER,
  durata_minuti_consigliata INTEGER,

  -- Note e istruzioni
  note_fisioterapista TEXT,
  obiettivi_specifici TEXT,

  -- Stato
  attivo BOOLEAN NOT NULL DEFAULT TRUE,
  completato BOOLEAN NOT NULL DEFAULT FALSE,
  data_completamento TIMESTAMPTZ,

  -- Statistiche
  numero_sessioni_completate INTEGER NOT NULL DEFAULT 0,
  ultima_sessione TIMESTAMPTZ,

  -- Metadata
  data_creazione TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_aggiornamento TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_esercizi_pazienti_paziente
  ON esercizi_pazienti(paziente_id) WHERE attivo = TRUE;

CREATE INDEX IF NOT EXISTS idx_esercizi_pazienti_fisioterapista
  ON esercizi_pazienti(fisioterapista_id);

CREATE INDEX IF NOT EXISTS idx_esercizi_pazienti_esercizio
  ON esercizi_pazienti(esercizio_id);

CREATE INDEX IF NOT EXISTS idx_esercizi_pazienti_attivi
  ON esercizi_pazienti(paziente_id, attivo, completato)
  WHERE attivo = TRUE;

-- Constraint: un paziente non può avere lo stesso esercizio assegnato più volte in modo attivo
CREATE UNIQUE INDEX IF NOT EXISTS idx_esercizi_pazienti_unici
  ON esercizi_pazienti(paziente_id, esercizio_id)
  WHERE attivo = TRUE;

-- Trigger per aggiornare data_aggiornamento
CREATE OR REPLACE TRIGGER trigger_update_esercizi_pazienti_timestamp
  BEFORE UPDATE ON esercizi_pazienti
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Vista semplificata (senza categorie)
CREATE OR REPLACE VIEW esercizi_pazienti_completa AS
SELECT
  ep.id,
  ep.paziente_id,
  ep.esercizio_id,
  ep.fisioterapista_id,
  ep.data_assegnazione,
  ep.data_inizio,
  ep.data_fine,
  ep.frequenza_settimanale,
  ep.durata_minuti_consigliata,
  ep.note_fisioterapista,
  ep.obiettivi_specifici,
  ep.attivo,
  ep.completato,
  ep.data_completamento,
  ep.numero_sessioni_completate,
  ep.ultima_sessione,
  ep.data_creazione,
  ep.data_aggiornamento,

  -- Dati paziente
  p.nome_paziente,
  p.cognome_paziente,
  p.codice_fiscale,

  -- Dati esercizio
  te.nome_esercizio,
  te.descrizione AS descrizione_esercizio,
  te.istruzioni AS istruzioni_esercizio,
  te.difficolta,
  te.parti_corpo_coinvolte,
  te.configurazione_mediapipe,

  -- Dati fisioterapista
  f.numero_albo,
  prof.nome AS fisioterapista_nome,
  prof.cognome AS fisioterapista_cognome

FROM esercizi_pazienti ep
JOIN pazienti p ON ep.paziente_id = p.id
JOIN tipi_esercizio te ON ep.esercizio_id = te.id
JOIN fisioterapisti f ON ep.fisioterapista_id = f.id
JOIN profili prof ON f.profilo_id = prof.id;
