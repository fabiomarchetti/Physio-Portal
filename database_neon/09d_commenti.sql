-- =====================================================
-- PARTE 2: Aggiungi commenti
-- ESEGUIRE SOLO DOPO 09c_solo_colonne.sql
-- =====================================================

COMMENT ON COLUMN tipi_esercizio.condiviso IS 'Se TRUE, esercizio visibile a tutti. Se FALSE, specifico per un paziente';
COMMENT ON COLUMN tipi_esercizio.creato_per_paziente_id IS 'Paziente per cui è stato creato (se personalizzato)';
COMMENT ON COLUMN tipi_esercizio.creato_da_fisioterapista_id IS 'Fisioterapista che ha creato l''esercizio';
COMMENT ON COLUMN esercizi_pazienti.ripetizioni_per_sessione IS 'Numero ripetizioni consigliate per ogni sessione';
