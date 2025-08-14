-- Script per eliminare tutti i dati dalla tabella esercizi e azzerare l'autoincremento

-- Elimino tutti i dati dalla tabella esercizi
DELETE FROM esercizi;

-- Azzero l'autoincremento dell'id_esercizio
-- Metodo 1: Usando ALTER SEQUENCE (PostgreSQL/Supabase)
ALTER SEQUENCE esercizi_id_esercizio_seq RESTART WITH 1;

-- Metodo 2: Alternativa usando TRUNCATE (più veloce e resetta anche l'autoincremento)
-- TRUNCATE TABLE esercizi RESTART IDENTITY CASCADE;

-- Query di verifica
SELECT COUNT(*) as totale_esercizi_rimanenti FROM esercizi;

-- Verifica che l'autoincremento sia azzerato
SELECT last_value FROM esercizi_id_esercizio_seq;
