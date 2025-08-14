-- SCRIPT SQL PER TABELLA ESERCIZI
-- Sistema Physio Portal - Riabilitazione Post-traumatica

-- Creazione tabella ESERCIZI
CREATE TABLE IF NOT EXISTS public.esercizi (
    id_esercizio INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    id_categoria INTEGER NOT NULL REFERENCES public.categorie_esercizi(id) ON DELETE RESTRICT,
    nome_esercizio TEXT NOT NULL,
    img_esercizio TEXT NOT NULL,
    descrizione_esecuzione TEXT NOT NULL,
    note TEXT,
    landmark INTEGER[] -- array di interi per i landmarks MediaPipe
);

-- Creazione indici per performance
CREATE INDEX IF NOT EXISTS idx_esercizi_categoria ON public.esercizi(id_categoria);
CREATE INDEX IF NOT EXISTS idx_esercizi_nome ON public.esercizi(nome_esercizio);

-- Abilitazione Row Level Security
ALTER TABLE public.esercizi ENABLE ROW LEVEL SECURITY;

-- POLITICHE RLS (Row Level Security)

-- Policy SELECT: Tutti gli utenti autenticati possono leggere gli esercizi
CREATE POLICY "Lettura esercizi per utenti autenticati"
ON public.esercizi
FOR SELECT
TO authenticated
USING (true);

-- Policy INSERT: Solo fisioterapisti possono inserire nuovi esercizi
CREATE POLICY "Inserimento esercizi solo per fisioterapisti"
ON public.esercizi
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profili p
        WHERE p.id = auth.uid()
        AND p.ruolo = 'fisioterapista'
    )
);

-- Policy UPDATE: Solo fisioterapisti possono aggiornare gli esercizi
CREATE POLICY "Aggiornamento esercizi solo per fisioterapisti"
ON public.esercizi
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

-- Policy DELETE: Solo fisioterapisti possono eliminare esercizi
-- ATTENZIONE: L'eliminazione dovrebbe essere limitata per preservare integrità dati sessioni
CREATE POLICY "Eliminazione esercizi solo per fisioterapisti"
ON public.esercizi
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
-- RIMOSSO: Non più necessario dato che abbiamo rimosso le colonne timestamp

-- Esempi di dati iniziali per testing (opzionale)
-- Inserire dopo aver popolato la tabella categorie_esercizi

/*
-- Esempi per Rachide Cervicale (categoria 1)
INSERT INTO public.esercizi (id_categoria, nome_esercizio, img_esercizio, descrizione_esecuzione, note) VALUES
(1, 'Flessione del collo', 'cervicale_flessione.jpg', 'Abbassare lentamente il mento verso il petto mantenendo la posizione per 5-10 secondi', 'Evitare movimenti bruschi. Ripetere 10-15 volte'),
(1, 'Estensione del collo', 'cervicale_estensione.jpg', 'Sollevare delicatamente il mento verso l''alto mantenendo la posizione per 5-10 secondi', 'Non forzare il movimento. Ripetere 10-15 volte'),
(1, 'Rotazione laterale destra', 'cervicale_rotazione_dx.jpg', 'Ruotare la testa verso destra mantenendo le spalle ferme', 'Movimento lento e controllato'),
(1, 'Rotazione laterale sinistra', 'cervicale_rotazione_sx.jpg', 'Ruotare la testa verso sinistra mantenendo le spalle ferme', 'Movimento lento e controllato');

-- Esempi per Spalla (categoria 2)  
INSERT INTO public.esercizi (id_categoria, nome_esercizio, img_esercizio, descrizione_esecuzione, note) VALUES
(2, 'Circonduzioni spalla', 'spalla_circonduzioni.jpg', 'Eseguire movimenti circolari lenti con le spalle avanti e indietro', 'Iniziare con 10 ripetizioni per direzione'),
(2, 'Elevazione laterale braccia', 'spalla_elevazione.jpg', 'Sollevare lateralmente le braccia fino all''altezza delle spalle', 'Mantenere il controllo durante tutto il movimento');
*/

-- Commenti per documentazione
COMMENT ON TABLE public.esercizi IS 'Catalogo esercizi di riabilitazione secondo protocolli Physio-Portal per categorie specifiche';
COMMENT ON COLUMN public.esercizi.id_esercizio IS 'Identificativo univoco dell''esercizio';
COMMENT ON COLUMN public.esercizi.id_categoria IS 'Riferimento alla categoria di appartenenza dell''esercizio';
COMMENT ON COLUMN public.esercizi.nome_esercizio IS 'Nome descrittivo dell''esercizio riabilitativo';
COMMENT ON COLUMN public.esercizi.img_esercizio IS 'Nome del file immagine dimostrativa dell''esercizio';
COMMENT ON COLUMN public.esercizi.descrizione_esecuzione IS 'Istruzioni dettagliate per l''esecuzione corretta dell''esercizio';
COMMENT ON COLUMN public.esercizi.note IS 'Note aggiuntive, precauzioni o variazioni dell''esercizio';
COMMENT ON COLUMN public.esercizi.landmark IS 'Array di landmarks MediaPipe per il monitoraggio computerizzato dell''esercizio';