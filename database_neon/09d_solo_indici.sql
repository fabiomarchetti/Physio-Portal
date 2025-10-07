-- =====================================================
-- PARTE 2: Solo indici
-- ESEGUIRE SOLO DOPO 09c_solo_colonne.sql
-- =====================================================

-- Indice per esercizi condivisi
CREATE INDEX idx_tipi_esercizio_condiviso
  ON tipi_esercizio(condiviso)
  WHERE condiviso = TRUE;

-- Indice per esercizi personalizzati di un paziente
CREATE INDEX idx_tipi_esercizio_paziente
  ON tipi_esercizio(creato_per_paziente_id)
  WHERE creato_per_paziente_id IS NOT NULL;

-- Indice per esercizi creati da un fisioterapista
CREATE INDEX idx_tipi_esercizio_fisioterapista
  ON tipi_esercizio(creato_da_fisioterapista_id)
  WHERE creato_da_fisioterapista_id IS NOT NULL;
