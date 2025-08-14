-- SCRIPT SQL PER CREAZIONE TABELLA LANDMARKS
-- Sistema Physio Portal - Riabilitazione Post-traumatica

-- Creazione tabella LANDMARKS
CREATE TABLE IF NOT EXISTS public.landmarks (
    id_landmark INTEGER PRIMARY KEY,
    parte_del_corpo TEXT NOT NULL,
    descrizione TEXT NOT NULL,
    punto_landmark INTEGER NOT NULL UNIQUE
);

-- Abilitazione Row Level Security
ALTER TABLE public.landmarks ENABLE ROW LEVEL SECURITY;

-- INSERIMENTO DATI LANDMARKS DA CSV
INSERT INTO public.landmarks (id_landmark, parte_del_corpo, descrizione, punto_landmark) VALUES
(1, 'NASO', 'Naso', 0),
(2, 'OCCHIO_SINISTRO_INTERNO', 'Angolo interno occhio sinistro', 1),
(3, 'OCCHIO_SINISTRO', 'Centro occhio sinistro', 2),
(4, 'OCCHIO_SINISTRO_ESTERNO', 'Angolo esterno occhio sinistro', 3),
(5, 'OCCHIO_DESTRO_INTERNO', 'Angolo interno occhio destro', 4),
(6, 'OCCHIO_DESTRO', 'Centro occhio destro', 5),
(7, 'OCCHIO_DESTRO_ESTERNO', 'Angolo esterno occhio destro', 6),
(8, 'ORECCHIO_SINISTRO', 'Orecchio sinistro', 7),
(9, 'ORECCHIO_DESTRO', 'Orecchio destro', 8),
(10, 'BOCCA_SINISTRA', 'Angolo sinistro della bocca', 9),
(11, 'BOCCA_DESTRA', 'Angolo destro della bocca', 10),
(12, 'SPALLA_SINISTRA', 'Spalla sinistra', 11),
(13, 'SPALLA_DESTRA', 'Spalla destra', 12),
(14, 'GOMITO_SINISTRO', 'Gomito sinistro', 13),
(15, 'GOMITO_DESTRO', 'Gomito destro', 14),
(16, 'POLSO_SINISTRO', 'Polso sinistro', 15),
(17, 'POLSO_DESTRO', 'Polso destro', 16),
(18, 'MIGNOLO_SINISTRO', 'Mignolo sinistro', 17),
(19, 'MIGNOLO_DESTRO', 'Mignolo destro', 18),
(20, 'INDICE_SINISTRO', 'Indice sinistro', 19),
(21, 'INDICE_DESTRO', 'Indice destro', 20),
(22, 'POLLICE_SINISTRO', 'Pollice sinistro', 21),
(23, 'POLLICE_DESTRO', 'Pollice destro', 22),
(24, 'ANCA_SINISTRA', 'Anca sinistra', 23),
(25, 'ANCA_DESTRA', 'Anca destra', 24),
(26, 'GINOCCHIO_SINISTRO', 'Ginocchio sinistro', 25),
(27, 'GINOCCHIO_DESTRO', 'Ginocchio destro', 26),
(28, 'CAVIGLIA_SINISTRA', 'Caviglia sinistra', 27),
(29, 'CAVIGLIA_DESTRA', 'Caviglia destra', 28),
(30, 'TALLONE_SINISTRO', 'Tallone sinistro', 29),
(31, 'TALLONE_DESTRO', 'Tallone destro', 30),
(32, 'PUNTA_PIEDE_SINISTRO', 'Punta piede sinistro', 31),
(33, 'PUNTA_PIEDE_DESTRO', 'Punta piede destro', 32)
ON CONFLICT DO NOTHING;

-- Creazione indici per performance
CREATE INDEX IF NOT EXISTS idx_landmarks_parte_corpo ON public.landmarks(parte_del_corpo);
CREATE INDEX IF NOT EXISTS idx_landmarks_punto ON public.landmarks(punto_landmark);

-- POLITICHE RLS (Row Level Security)

-- Policy SELECT: Tutti gli utenti autenticati possono leggere i landmarks
CREATE POLICY "Lettura landmarks per utenti autenticati"
ON public.landmarks
FOR SELECT
TO authenticated
USING (true);

-- Policy INSERT: Solo fisioterapisti possono inserire nuovi landmarks
CREATE POLICY "Inserimento landmarks solo per fisioterapisti"
ON public.landmarks
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profili p
        WHERE p.id = auth.uid()
        AND p.ruolo = 'fisioterapista'
    )
);

-- Policy UPDATE: Solo fisioterapisti possono aggiornare i landmarks
CREATE POLICY "Aggiornamento landmarks solo per fisioterapisti"
ON public.landmarks
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profili p
        WHERE p.id = auth.uid()
        AND p.ruolo = 'fisioterapista'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profili p
        WHERE p.id = auth.uid()
        AND p.ruolo = 'fisioterapista'
    )
);

-- Policy DELETE: Solo fisioterapisti possono eliminare landmarks
CREATE POLICY "Eliminazione landmarks solo per fisioterapisti"
ON public.landmarks
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profili p
        WHERE p.id = auth.uid()
        AND p.ruolo = 'fisioterapista'
    )
);

-- Commenti per documentazione
COMMENT ON TABLE public.landmarks IS 'Mappa dei punti landmark MediaPipe per il rilevamento della postura e movimenti corporei';
COMMENT ON COLUMN public.landmarks.id_landmark IS 'Identificativo univoco del landmark';
COMMENT ON COLUMN public.landmarks.parte_del_corpo IS 'Nome identificativo della parte del corpo (es. SPALLA_SINISTRA)';
COMMENT ON COLUMN public.landmarks.descrizione IS 'Descrizione leggibile del punto landmark';
COMMENT ON COLUMN public.landmarks.punto_landmark IS 'Numero del punto MediaPipe corrispondente (0-32)';

-- Query per verifica dei dati inseriti
-- SELECT * FROM public.landmarks ORDER BY punto_landmark;

COMMIT;