-- =====================================================
-- PARTE 1: Solo la tabella esercizi_pazienti
-- =====================================================

CREATE TABLE IF NOT EXISTS esercizi_pazienti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paziente_id UUID NOT NULL REFERENCES pazienti(id) ON DELETE CASCADE,
  esercizio_id UUID NOT NULL REFERENCES tipi_esercizio(id) ON DELETE CASCADE,
  fisioterapista_id UUID NOT NULL REFERENCES fisioterapisti(id) ON DELETE CASCADE,
  data_assegnazione TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_inizio DATE,
  data_fine DATE,
  frequenza_settimanale INTEGER,
  durata_minuti_consigliata INTEGER,
  note_fisioterapista TEXT,
  obiettivi_specifici TEXT,
  attivo BOOLEAN NOT NULL DEFAULT TRUE,
  completato BOOLEAN NOT NULL DEFAULT FALSE,
  data_completamento TIMESTAMPTZ,
  numero_sessioni_completate INTEGER NOT NULL DEFAULT 0,
  ultima_sessione TIMESTAMPTZ,
  data_creazione TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_aggiornamento TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
