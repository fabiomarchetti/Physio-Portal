-- Script SQL per aggiungere colonne nome_paziente e cognome_paziente alla tabella pazienti
-- Data: 2025-08-09

-- Aggiunta delle colonne nome_paziente e cognome_paziente
ALTER TABLE pazienti 
ADD COLUMN nome_paziente TEXT NOT NULL DEFAULT '',
ADD COLUMN cognome_paziente TEXT NOT NULL DEFAULT '';

-- Popolare le nuove colonne con i dati esistenti dalla tabella profili
-- (nel caso ci siano già dati nella tabella pazienti)
UPDATE pazienti 
SET 
    nome_paziente = profili.nome,
    cognome_paziente = profili.cognome
FROM profili 
WHERE pazienti.profilo_id = profili.id;

-- Rimuovere i valori di default dopo aver popolato i dati
ALTER TABLE pazienti 
ALTER COLUMN nome_paziente DROP DEFAULT,
ALTER COLUMN cognome_paziente DROP DEFAULT;

-- Aggiungere indici per migliorare le performance delle ricerche
CREATE INDEX IF NOT EXISTS idx_pazienti_nome_paziente ON pazienti(nome_paziente);
CREATE INDEX IF NOT EXISTS idx_pazienti_cognome_paziente ON pazienti(cognome_paziente);
CREATE INDEX IF NOT EXISTS idx_pazienti_nome_cognome ON pazienti(nome_paziente, cognome_paziente);

-- Commento finale
COMMENT ON COLUMN pazienti.nome_paziente IS 'Nome del paziente';
COMMENT ON COLUMN pazienti.cognome_paziente IS 'Cognome del paziente';