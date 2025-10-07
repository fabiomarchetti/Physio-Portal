-- =====================================================
-- PARTE 1: Solo aggiunta colonne (senza commenti)
-- =====================================================

-- Aggiungi colonne a tipi_esercizio
ALTER TABLE tipi_esercizio
ADD COLUMN condiviso BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE tipi_esercizio
ADD COLUMN creato_per_paziente_id UUID REFERENCES pazienti(id) ON DELETE SET NULL;

ALTER TABLE tipi_esercizio
ADD COLUMN creato_da_fisioterapista_id UUID REFERENCES fisioterapisti(id) ON DELETE SET NULL;

-- Aggiungi colonna a esercizi_pazienti
ALTER TABLE esercizi_pazienti
ADD COLUMN ripetizioni_per_sessione INTEGER;
