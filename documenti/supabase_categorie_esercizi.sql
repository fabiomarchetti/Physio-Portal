-- SCRIPT SQL PER TABELLA CATEGORIE_ESERCIZI
-- Sistema Physio Portal - Riabilitazione Post-traumatica

-- Creazione tabella CATEGORIE_ESERCIZI
CREATE TABLE IF NOT EXISTS public.categorie_esercizi (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    nome_categoria TEXT NOT NULL,
    img_categoria TEXT NOT NULL,
    data_creazione TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_aggiornamento TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abilitazione Row Level Security
ALTER TABLE public.categorie_esercizi ENABLE ROW LEVEL SECURITY;

-- Inserimento dati iniziali
INSERT INTO public.categorie_esercizi (nome_categoria, img_categoria) VALUES
('Rachide Cervicale', 'rachide_cervicale.jpg'),
('Spalla, Gomito e Polso', 'spalla_gomito_polso.jpg'),
('Tratto Lombare', 'tratto_lombare.jpg'),
('Anca e Ginocchio', 'anca_ginocchio.jpg'),
('Caviglia e Piede', 'caviglia_piede.jpg')
ON CONFLICT DO NOTHING;

-- POLITICHE RLS (Row Level Security)

-- Policy SELECT: Tutti gli utenti autenticati possono leggere le categorie
CREATE POLICY "Lettura categorie esercizi per utenti autenticati"
ON public.categorie_esercizi
FOR SELECT
TO authenticated
USING (true);

-- Policy INSERT: Solo fisioterapisti possono inserire nuove categorie
CREATE POLICY "Inserimento categorie solo per fisioterapisti"
ON public.categorie_esercizi
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profili p
        WHERE p.id = auth.uid()
        AND p.ruolo = 'fisioterapista'
    )
);

-- Policy UPDATE: Solo fisioterapisti possono aggiornare le categorie
CREATE POLICY "Aggiornamento categorie solo per fisioterapisti"
ON public.categorie_esercizi
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

-- Policy DELETE: Solo fisioterapisti possono eliminare categorie
-- ATTENZIONE: L'eliminazione dovrebbe essere limitata per preservare integrità referenziale
CREATE POLICY "Eliminazione categorie solo per fisioterapisti"
ON public.categorie_esercizi
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profili p
        WHERE p.id = auth.uid()
        AND p.ruolo = 'fisioterapista'
    )
);

-- Trigger per aggiornamento automatico data_aggiornamento
CREATE OR REPLACE FUNCTION update_data_aggiornamento()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_aggiornamento = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_data_aggiornamento
    BEFORE UPDATE ON public.categorie_esercizi
    FOR EACH ROW
    EXECUTE FUNCTION update_data_aggiornamento();

-- Commenti per documentazione
COMMENT ON TABLE public.categorie_esercizi IS 'Categorie degli esercizi di riabilitazione secondo protocolli Physio-Portal';
COMMENT ON COLUMN public.categorie_esercizi.id IS 'Identificativo univoco della categoria';
COMMENT ON COLUMN public.categorie_esercizi.nome_categoria IS 'Nome della categoria di esercizi riabilitativi';
COMMENT ON COLUMN public.categorie_esercizi.img_categoria IS 'Nome del file immagine associato alla categoria';
COMMENT ON COLUMN public.categorie_esercizi.data_creazione IS 'Timestamp di creazione del record';
COMMENT ON COLUMN public.categorie_esercizi.data_aggiornamento IS 'Timestamp ultimo aggiornamento del record';