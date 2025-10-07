-- =====================================================
-- AGGIUNTA RUOLO SVILUPPATORE
-- =====================================================
-- Modifica il vincolo CHECK per includere 'sviluppatore'

-- 1) Rimuovi il vecchio vincolo CHECK
ALTER TABLE profili
DROP CONSTRAINT IF EXISTS profili_ruolo_check;

-- 2) Aggiungi nuovo vincolo con 'sviluppatore'
ALTER TABLE profili
ADD CONSTRAINT profili_ruolo_check
CHECK (ruolo IN ('sviluppatore', 'fisioterapista', 'paziente'));

-- 3) Crea tabella sviluppatori (simile a fisioterapisti e pazienti)
CREATE TABLE IF NOT EXISTS sviluppatori (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profilo_id UUID NOT NULL UNIQUE REFERENCES profili(id) ON DELETE CASCADE,
  azienda VARCHAR(200),
  ruolo_aziendale VARCHAR(200),
  permessi_speciali TEXT[],
  data_creazione TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sviluppatori IS 'Sviluppatori/amministratori del sistema con permessi speciali';
COMMENT ON COLUMN sviluppatori.permessi_speciali IS 'Array di permessi speciali (es. ["gestione_utenti", "backup_database"])';

-- 4) Indice per performance
CREATE INDEX IF NOT EXISTS idx_sviluppatori_profilo_id ON sviluppatori(profilo_id);

-- 5) Funzione registrazione sviluppatore
CREATE OR REPLACE FUNCTION registra_sviluppatore(
  p_nome VARCHAR,
  p_cognome VARCHAR,
  p_email VARCHAR,
  p_password VARCHAR,
  p_azienda VARCHAR DEFAULT NULL,
  p_ruolo_aziendale VARCHAR DEFAULT 'Sviluppatore'
)
RETURNS TABLE (
  profilo_id UUID,
  sviluppatore_id UUID,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_profilo_id UUID;
  v_sviluppatore_id UUID;
  v_password_hash VARCHAR;
BEGIN
  -- Verifica se email già esiste
  IF EXISTS (SELECT 1 FROM profili WHERE email = p_email) THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, FALSE, 'Email già registrata'::TEXT;
    RETURN;
  END IF;

  -- Hash password
  v_password_hash := hash_password(p_password);

  -- Crea profilo sviluppatore
  INSERT INTO profili (ruolo, nome, cognome, email, password_hash)
  VALUES ('sviluppatore', p_nome, p_cognome, p_email, v_password_hash)
  RETURNING id INTO v_profilo_id;

  -- Crea record sviluppatore
  INSERT INTO sviluppatori (
    profilo_id,
    azienda,
    ruolo_aziendale,
    permessi_speciali
  )
  VALUES (
    v_profilo_id,
    p_azienda,
    p_ruolo_aziendale,
    ARRAY['gestione_utenti', 'visualizza_tutti_pazienti', 'gestione_esercizi', 'backup_database']
  )
  RETURNING id INTO v_sviluppatore_id;

  RETURN QUERY SELECT v_profilo_id, v_sviluppatore_id, TRUE, 'Sviluppatore registrato con successo'::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION registra_sviluppatore IS 'Registra un nuovo sviluppatore/amministratore del sistema';

-- 6) Funzione login sviluppatore
CREATE OR REPLACE FUNCTION login_sviluppatore(
  p_email VARCHAR,
  p_password VARCHAR
)
RETURNS TABLE (
  profilo_id UUID,
  sviluppatore_id UUID,
  nome VARCHAR,
  cognome VARCHAR,
  email VARCHAR,
  azienda VARCHAR,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_profilo profili%ROWTYPE;
  v_sviluppatore sviluppatori%ROWTYPE;
BEGIN
  -- Cerca profilo per email
  SELECT * INTO v_profilo
  FROM profili
  WHERE profili.email = p_email
    AND ruolo = 'sviluppatore';

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::VARCHAR, NULL::VARCHAR,
                        NULL::VARCHAR, NULL::VARCHAR, FALSE, 'Credenziali non valide'::TEXT;
    RETURN;
  END IF;

  -- Verifica password
  IF NOT verifica_password(p_password, v_profilo.password_hash) THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::VARCHAR, NULL::VARCHAR,
                        NULL::VARCHAR, NULL::VARCHAR, FALSE, 'Credenziali non valide'::TEXT;
    RETURN;
  END IF;

  -- Ottieni dati sviluppatore
  SELECT * INTO v_sviluppatore
  FROM sviluppatori
  WHERE profilo_id = v_profilo.id;

  RETURN QUERY SELECT
    v_profilo.id,
    v_sviluppatore.id,
    v_profilo.nome,
    v_profilo.cognome,
    v_profilo.email,
    v_sviluppatore.azienda,
    TRUE,
    'Login effettuato'::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION login_sviluppatore IS 'Autentica uno sviluppatore/amministratore tramite email e password';

-- 7) Aggiorna get_profilo_completo per includere sviluppatori
DROP FUNCTION IF EXISTS get_profilo_completo(UUID);

CREATE OR REPLACE FUNCTION get_profilo_completo(p_profilo_id UUID)
RETURNS TABLE (
  id UUID,
  ruolo VARCHAR,
  nome VARCHAR,
  cognome VARCHAR,
  email VARCHAR,
  dati_specifici JSONB
) AS $$
DECLARE
  v_profilo profili%ROWTYPE;
  v_dati_specifici JSONB;
BEGIN
  -- Ottieni profilo base
  SELECT * INTO v_profilo
  FROM profili p
  WHERE p.id = p_profilo_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Ottieni dati specifici in base al ruolo
  IF v_profilo.ruolo = 'sviluppatore' THEN
    SELECT jsonb_build_object(
      'sviluppatore_id', s.id,
      'azienda', s.azienda,
      'ruolo_aziendale', s.ruolo_aziendale,
      'permessi_speciali', s.permessi_speciali
    ) INTO v_dati_specifici
    FROM sviluppatori s
    WHERE s.profilo_id = p_profilo_id;
  ELSIF v_profilo.ruolo = 'fisioterapista' THEN
    SELECT jsonb_build_object(
      'fisioterapista_id', f.id,
      'numero_albo', f.numero_albo,
      'specializzazione', f.specializzazione,
      'nome_clinica', f.nome_clinica,
      'indirizzo_clinica', f.indirizzo_clinica,
      'telefono', f.telefono,
      'email_clinica', f.email_clinica
    ) INTO v_dati_specifici
    FROM fisioterapisti f
    WHERE f.profilo_id = p_profilo_id;
  ELSIF v_profilo.ruolo = 'paziente' THEN
    SELECT jsonb_build_object(
      'paziente_id', p.id,
      'fisioterapista_id', p.fisioterapista_id,
      'data_nascita', p.data_nascita,
      'codice_fiscale', p.codice_fiscale,
      'telefono', p.telefono,
      'diagnosi', p.diagnosi,
      'piano_terapeutico', p.piano_terapeutico,
      'attivo', p.attivo
    ) INTO v_dati_specifici
    FROM pazienti p
    WHERE p.profilo_id = p_profilo_id;
  END IF;

  RETURN QUERY SELECT
    v_profilo.id,
    v_profilo.ruolo,
    v_profilo.nome,
    v_profilo.cognome,
    v_profilo.email,
    v_dati_specifici;
END;
$$ LANGUAGE plpgsql;

-- 8) Crea utente sviluppatore Fabio Marchetti
SELECT * FROM registra_sviluppatore(
  'Fabio',
  'Marchetti',
  'marchettisoft@gmail.com',
  'Filohori11!',
  'MarchettiSoft',
  'Full Stack Developer'
);

-- 9) Verifica creazione
SELECT
  p.id,
  p.nome,
  p.cognome,
  p.email,
  p.ruolo,
  s.azienda,
  s.ruolo_aziendale,
  s.permessi_speciali
FROM profili p
INNER JOIN sviluppatori s ON s.profilo_id = p.id
WHERE p.email = 'marchettisoft@gmail.com';
