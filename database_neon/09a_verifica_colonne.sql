-- Script di verifica per controllare lo stato della tabella tipi_esercizio

-- 1. Verifica colonne esistenti in tipi_esercizio
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tipi_esercizio'
ORDER BY ordinal_position;

-- 2. Verifica se la tabella fisioterapisti ha la colonna id
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'fisioterapisti' AND column_name = 'id';
