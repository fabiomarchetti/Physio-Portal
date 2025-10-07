-- =====================================================
-- AGGIORNAMENTO: Sistema esercizi personalizzati
-- Descrizione: Aggiunge campi per esercizi specifici paziente con storico
-- =====================================================

-- Aggiungi colonne a tipi_esercizio (separate per compatibilità)
ALTER TABLE tipi_esercizio
ADD COLUMN IF NOT EXISTS condiviso BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE tipi_esercizio
ADD COLUMN IF NOT EXISTS creato_per_paziente_id UUID REFERENCES pazienti(id) ON DELETE SET NULL;

ALTER TABLE tipi_esercizio
ADD COLUMN IF NOT EXISTS creato_da_fisioterapista_id UUID REFERENCES fisioterapisti(id) ON DELETE SET NULL;

-- Aggiungi colonne a esercizi_pazienti
ALTER TABLE esercizi_pazienti
ADD COLUMN IF NOT EXISTS ripetizioni_per_sessione INTEGER;

-- Commenti
COMMENT ON COLUMN tipi_esercizio.condiviso IS 'Se TRUE, esercizio visibile a tutti. Se FALSE, specifico per un paziente';
COMMENT ON COLUMN tipi_esercizio.creato_per_paziente_id IS 'Paziente per cui è stato creato (se personalizzato)';
COMMENT ON COLUMN tipi_esercizio.creato_da_fisioterapista_id IS 'Fisioterapista che ha creato l''esercizio';
COMMENT ON COLUMN esercizi_pazienti.ripetizioni_per_sessione IS 'Numero ripetizioni consigliate per ogni sessione';

-- Indice per esercizi condivisi
CREATE INDEX IF NOT EXISTS idx_tipi_esercizio_condiviso
  ON tipi_esercizio(condiviso)
  WHERE condiviso = TRUE;

-- Indice per esercizi personalizzati di un paziente
CREATE INDEX IF NOT EXISTS idx_tipi_esercizio_paziente
  ON tipi_esercizio(creato_per_paziente_id)
  WHERE creato_per_paziente_id IS NOT NULL;

-- Indice per esercizi creati da un fisioterapista
CREATE INDEX IF NOT EXISTS idx_tipi_esercizio_fisioterapista
  ON tipi_esercizio(creato_da_fisioterapista_id)
  WHERE creato_da_fisioterapista_id IS NOT NULL;
