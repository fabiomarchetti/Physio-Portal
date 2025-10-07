-- =====================================================
-- VERIFICA: Controlla se la colonna id_categoria esiste in tipi_esercizio
-- =====================================================

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tipi_esercizio'
  AND column_name = 'id_categoria';

-- Se il risultato è vuoto, esegui lo script 07_categorie_esercizi.sql PRIMA di procedere
