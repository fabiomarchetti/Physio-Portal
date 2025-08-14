| table_name              | column_name               | data_type                | is_nullable |
| ----------------------- | ------------------------- | ------------------------ | ----------- |
| categorie_esercizi      | id                        | integer                  | NO          |
| categorie_esercizi      | nome_categoria            | text                     | NO          |
| categorie_esercizi      | img_categoria             | text                     | NO          |
| categorie_esercizi      | data_creazione            | timestamp with time zone | YES         |
| categorie_esercizi      | data_aggiornamento        | timestamp with time zone | YES         |
| configurazioni_sistema  | id                        | uuid                     | NO          |
| configurazioni_sistema  | nome_configurazione       | text                     | NO          |
| configurazioni_sistema  | valore_configurazione     | jsonb                    | NO          |
| configurazioni_sistema  | descrizione               | text                     | YES         |
| configurazioni_sistema  | categoria                 | text                     | NO          |
| configurazioni_sistema  | modificabile_da           | text                     | YES         |
| configurazioni_sistema  | data_creazione            | timestamp with time zone | YES         |
| configurazioni_sistema  | data_aggiornamento        | timestamp with time zone | YES         |
| dati_movimento          | id                        | uuid                     | NO          |
| dati_movimento          | sessione_id               | uuid                     | NO          |
| dati_movimento          | timestamp_rilevamento     | timestamp with time zone | NO          |
| dati_movimento          | punti_corpo               | jsonb                    | YES         |
| dati_movimento          | punti_mani                | jsonb                    | YES         |
| dati_movimento          | punti_pose                | jsonb                    | YES         |
| dati_movimento          | frame_numero              | integer                  | YES         |
| dati_movimento          | confidenza_rilevamento    | double precision         | YES         |
| dati_movimento          | data_creazione            | timestamp with time zone | YES         |
| esercizi                | id_esercizio              | integer                  | NO          |
| esercizi                | id_categoria              | integer                  | NO          |
| esercizi                | nome_esercizio            | text                     | NO          |
| esercizi                | img_esercizio             | text                     | NO          |
| esercizi                | descrizione_esecuzione    | text                     | NO          |
| esercizi                | note                      | text                     | YES         |
| fisioterapisti          | id                        | uuid                     | NO          |
| fisioterapisti          | profilo_id                | uuid                     | NO          |
| fisioterapisti          | numero_albo               | text                     | NO          |
| fisioterapisti          | specializzazione          | text                     | NO          |
| fisioterapisti          | nome_clinica              | text                     | NO          |
| fisioterapisti          | indirizzo_clinica         | text                     | NO          |
| fisioterapisti          | telefono                  | text                     | YES         |
| fisioterapisti          | email_clinica             | text                     | YES         |
| fisioterapisti          | data_creazione            | timestamp with time zone | YES         |
| fisioterapisti          | nome                      | text                     | NO          |
| fisioterapisti          | cognome                   | text                     | NO          |
| landmark                | id_landmark               | integer                  | NO          |
| landmark                | parte_corpo               | character varying        | NO          |
| landmark                | descrizione               | text                     | YES         |
| landmark                | punto_landmark            | character varying        | NO          |
| metriche_sessione       | id                        | uuid                     | NO          |
| metriche_sessione       | sessione_id               | uuid                     | NO          |
| metriche_sessione       | tipo_metrica              | text                     | NO          |
| metriche_sessione       | valore_metrica            | double precision         | NO          |
| metriche_sessione       | unita_misura              | text                     | NO          |
| metriche_sessione       | articolazione             | text                     | YES         |
| metriche_sessione       | timestamp_calcolo         | timestamp with time zone | NO          |
| metriche_sessione       | data_creazione            | timestamp with time zone | YES         |
| obiettivi_terapeutici   | id                        | uuid                     | NO          |
| obiettivi_terapeutici   | paziente_id               | uuid                     | NO          |
| obiettivi_terapeutici   | titolo_obiettivo          | text                     | NO          |
| obiettivi_terapeutici   | descrizione               | text                     | NO          |
| obiettivi_terapeutici   | tipo_obiettivo            | text                     | NO          |
| obiettivi_terapeutici   | valore_target             | double precision         | YES         |
| obiettivi_terapeutici   | unita_misura              | text                     | YES         |
| obiettivi_terapeutici   | data_scadenza             | date                     | YES         |
| obiettivi_terapeutici   | stato                     | text                     | YES         |
| obiettivi_terapeutici   | note_progresso            | text                     | YES         |
| obiettivi_terapeutici   | data_creazione            | timestamp with time zone | YES         |
| pazienti                | id                        | uuid                     | NO          |
| pazienti                | profilo_id                | uuid                     | NO          |
| pazienti                | fisioterapista_id         | uuid                     | NO          |
| pazienti                | data_nascita              | date                     | NO          |
| pazienti                | codice_fiscale            | text                     | YES         |
| pazienti                | telefono                  | text                     | YES         |
| pazienti                | diagnosi                  | text                     | NO          |
| pazienti                | piano_terapeutico         | text                     | NO          |
| pazienti                | note                      | text                     | YES         |
| pazienti                | attivo                    | boolean                  | YES         |
| pazienti                | data_creazione            | timestamp with time zone | YES         |
| profili                 | id                        | uuid                     | NO          |
| profili                 | ruolo                     | text                     | NO          |
| profili                 | nome                      | text                     | NO          |
| profili                 | cognome                   | text                     | NO          |
| profili                 | data_creazione            | timestamp with time zone | YES         |
| profili                 | data_aggiornamento        | timestamp with time zone | YES         |
| sessioni_riabilitazione | id                        | uuid                     | NO          |
| sessioni_riabilitazione | paziente_id               | uuid                     | NO          |
| sessioni_riabilitazione | data_inizio               | timestamp with time zone | NO          |
| sessioni_riabilitazione | data_fine                 | timestamp with time zone | YES         |
| sessioni_riabilitazione | durata_minuti             | integer                  | YES         |
| sessioni_riabilitazione | tipo_esercizio            | text                     | NO          |
| sessioni_riabilitazione | obiettivi                 | text                     | YES         |
| sessioni_riabilitazione | note                      | text                     | YES         |
| sessioni_riabilitazione | stato                     | text                     | YES         |
| sessioni_riabilitazione | punteggio_finale          | double precision         | YES         |
| sessioni_riabilitazione | data_creazione            | timestamp with time zone | YES         |
| tipi_esercizio          | id                        | uuid                     | NO          |
| tipi_esercizio          | nome_esercizio            | text                     | NO          |
| tipi_esercizio          | descrizione               | text                     | NO          |
| tipi_esercizio          | istruzioni                | text                     | NO          |
| tipi_esercizio          | durata_consigliata_minuti | integer                  | YES         |
| tipi_esercizio          | difficolta                | text                     | YES         |
| tipi_esercizio          | parti_corpo_coinvolte     | ARRAY                    | YES         |
| tipi_esercizio          | configurazione_mediapipe  | jsonb                    | YES         |
| tipi_esercizio          | attivo                    | boolean                  | YES         |
| tipi_esercizio          | data_creazione            | timestamp with time zone | YES         |