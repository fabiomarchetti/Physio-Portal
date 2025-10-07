-- =====================================================
-- PARTE 2: Indici e constraint per esercizi_pazienti
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_esercizi_pazienti_paziente
  ON esercizi_pazienti(paziente_id) WHERE attivo = TRUE;

CREATE INDEX IF NOT EXISTS idx_esercizi_pazienti_fisioterapista
  ON esercizi_pazienti(fisioterapista_id);

CREATE INDEX IF NOT EXISTS idx_esercizi_pazienti_esercizio
  ON esercizi_pazienti(esercizio_id);

CREATE INDEX IF NOT EXISTS idx_esercizi_pazienti_attivi
  ON esercizi_pazienti(paziente_id, attivo, completato)
  WHERE attivo = TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_esercizi_pazienti_unici
  ON esercizi_pazienti(paziente_id, esercizio_id)
  WHERE attivo = TRUE;
