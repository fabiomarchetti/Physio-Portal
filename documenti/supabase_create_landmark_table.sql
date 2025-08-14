-- Script per creare la tabella landmark in Supabase
-- Tabella per memorizzare i punti di riferimento del corpo per il rilevamento pose

CREATE TABLE IF NOT EXISTS landmark (
    id_landmark SERIAL PRIMARY KEY,
    parte_corpo VARCHAR(100) NOT NULL,
    descrizione TEXT,
    punto_landmark VARCHAR(50) NOT NULL
);

-- Aggiungo commenti per documentare la tabella
COMMENT ON TABLE landmark IS 'Tabella per memorizzare i punti di riferimento del corpo utilizzati nel rilevamento pose';
COMMENT ON COLUMN landmark.id_landmark IS 'Identificativo univoco autoincrementale del landmark';
COMMENT ON COLUMN landmark.parte_corpo IS 'Parte del corpo a cui appartiene il landmark';
COMMENT ON COLUMN landmark.descrizione IS 'Descrizione dettagliata del landmark';
COMMENT ON COLUMN landmark.punto_landmark IS 'Nome del punto landmark (es. nose, left_shoulder, etc.)';

-- Creo un indice per migliorare le performance delle query
CREATE INDEX IF NOT EXISTS idx_landmark_parte_corpo ON landmark(parte_corpo);
CREATE INDEX IF NOT EXISTS idx_landmark_punto_landmark ON landmark(punto_landmark);
