-- Verifica struttura tabella esercizi_pazienti
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'esercizi_pazienti'
ORDER BY ordinal_position;
