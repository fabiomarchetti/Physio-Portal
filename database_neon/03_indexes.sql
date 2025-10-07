-- =====================================================
-- INDICI PER OTTIMIZZAZIONE PERFORMANCE
-- =====================================================
-- Script per la creazione di indici sulle colonne più utilizzate

-- =====================================================
-- INDICI TABELLA: profili
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profili_email ON profili(email);
CREATE INDEX IF NOT EXISTS idx_profili_ruolo ON profili(ruolo);
CREATE INDEX IF NOT EXISTS idx_profili_cognome ON profili(cognome);

-- =====================================================
-- INDICI TABELLA: fisioterapisti
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_fisioterapisti_profilo_id ON fisioterapisti(profilo_id);
CREATE INDEX IF NOT EXISTS idx_fisioterapisti_numero_albo ON fisioterapisti(numero_albo);

-- =====================================================
-- INDICI TABELLA: pazienti
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_pazienti_profilo_id ON pazienti(profilo_id);
CREATE INDEX IF NOT EXISTS idx_pazienti_fisioterapista_id ON pazienti(fisioterapista_id);
CREATE INDEX IF NOT EXISTS idx_pazienti_codice_fiscale ON pazienti(codice_fiscale);
CREATE INDEX IF NOT EXISTS idx_pazienti_attivo ON pazienti(attivo);
CREATE INDEX IF NOT EXISTS idx_pazienti_cognome ON pazienti(cognome_paziente);

-- Indice composto per query frequenti
CREATE INDEX IF NOT EXISTS idx_pazienti_fisioterapista_attivo ON pazienti(fisioterapista_id, attivo);

-- =====================================================
-- INDICI TABELLA: tipi_esercizio
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_tipi_esercizio_attivo ON tipi_esercizio(attivo);
CREATE INDEX IF NOT EXISTS idx_tipi_esercizio_difficolta ON tipi_esercizio(difficolta);
CREATE INDEX IF NOT EXISTS idx_tipi_esercizio_nome ON tipi_esercizio(nome_esercizio);

-- Indice GIN per ricerca array parti_corpo_coinvolte
CREATE INDEX IF NOT EXISTS idx_tipi_esercizio_parti_corpo ON tipi_esercizio USING GIN(parti_corpo_coinvolte);

-- Indice GIN per ricerca JSONB configurazione_mediapipe
CREATE INDEX IF NOT EXISTS idx_tipi_esercizio_config_mediapipe ON tipi_esercizio USING GIN(configurazione_mediapipe);

-- =====================================================
-- INDICI TABELLA: sessioni_riabilitazione
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_sessioni_paziente_id ON sessioni_riabilitazione(paziente_id);
CREATE INDEX IF NOT EXISTS idx_sessioni_stato ON sessioni_riabilitazione(stato);
CREATE INDEX IF NOT EXISTS idx_sessioni_data_inizio ON sessioni_riabilitazione(data_inizio DESC);
CREATE INDEX IF NOT EXISTS idx_sessioni_tipo_esercizio ON sessioni_riabilitazione(tipo_esercizio);

-- Indici composti per query frequenti
CREATE INDEX IF NOT EXISTS idx_sessioni_paziente_stato ON sessioni_riabilitazione(paziente_id, stato);
CREATE INDEX IF NOT EXISTS idx_sessioni_paziente_data ON sessioni_riabilitazione(paziente_id, data_inizio DESC);

-- =====================================================
-- INDICI TABELLA: dati_movimento
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_dati_movimento_sessione_id ON dati_movimento(sessione_id);
CREATE INDEX IF NOT EXISTS idx_dati_movimento_timestamp ON dati_movimento(timestamp_rilevamento);
CREATE INDEX IF NOT EXISTS idx_dati_movimento_frame ON dati_movimento(frame_numero);

-- Indice composto per query temporali su sessione
CREATE INDEX IF NOT EXISTS idx_dati_movimento_sessione_timestamp ON dati_movimento(sessione_id, timestamp_rilevamento);

-- Indici GIN per ricerca JSONB
CREATE INDEX IF NOT EXISTS idx_dati_movimento_punti_corpo ON dati_movimento USING GIN(punti_corpo);
CREATE INDEX IF NOT EXISTS idx_dati_movimento_punti_mani ON dati_movimento USING GIN(punti_mani);
CREATE INDEX IF NOT EXISTS idx_dati_movimento_punti_pose ON dati_movimento USING GIN(punti_pose);

-- =====================================================
-- INDICI TABELLA: metriche_sessione
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_metriche_sessione_id ON metriche_sessione(sessione_id);
CREATE INDEX IF NOT EXISTS idx_metriche_tipo ON metriche_sessione(tipo_metrica);
CREATE INDEX IF NOT EXISTS idx_metriche_articolazione ON metriche_sessione(articolazione);
CREATE INDEX IF NOT EXISTS idx_metriche_timestamp ON metriche_sessione(timestamp_calcolo);

-- Indici composti per analisi metriche
CREATE INDEX IF NOT EXISTS idx_metriche_sessione_tipo ON metriche_sessione(sessione_id, tipo_metrica);
CREATE INDEX IF NOT EXISTS idx_metriche_tipo_articolazione ON metriche_sessione(tipo_metrica, articolazione);

-- =====================================================
-- INDICI TABELLA: obiettivi_terapeutici
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_obiettivi_paziente_id ON obiettivi_terapeutici(paziente_id);
CREATE INDEX IF NOT EXISTS idx_obiettivi_stato ON obiettivi_terapeutici(stato);
CREATE INDEX IF NOT EXISTS idx_obiettivi_tipo ON obiettivi_terapeutici(tipo_obiettivo);
CREATE INDEX IF NOT EXISTS idx_obiettivi_scadenza ON obiettivi_terapeutici(data_scadenza);

-- Indici composti per dashboard
CREATE INDEX IF NOT EXISTS idx_obiettivi_paziente_stato ON obiettivi_terapeutici(paziente_id, stato);

-- =====================================================
-- INDICI TABELLA: configurazioni_sistema
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_configurazioni_nome ON configurazioni_sistema(nome_configurazione);
CREATE INDEX IF NOT EXISTS idx_configurazioni_categoria ON configurazioni_sistema(categoria);

-- Indice GIN per ricerca JSONB configurazioni
CREATE INDEX IF NOT EXISTS idx_configurazioni_valore ON configurazioni_sistema USING GIN(valore_configurazione);
