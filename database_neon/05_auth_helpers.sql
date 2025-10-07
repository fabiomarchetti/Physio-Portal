-- =====================================================
-- FUNZIONI DI AUTENTICAZIONE E GESTIONE UTENTI
-- =====================================================
-- Script per funzioni di login, registrazione e gestione utenti
-- NOTA: A differenza di Supabase, Neon richiede gestione auth a livello applicativo

-- =====================================================
-- FUNZIONE: Registrazione fisioterapista
-- =====================================================
CREATE OR REPLACE FUNCTION registra_fisioterapista(
  p_nome VARCHAR,
  p_cognome VARCHAR,
  p_email VARCHAR,
  p_password VARCHAR,
  p_numero_albo VARCHAR,
  p_specializzazione VARCHAR,
  p_nome_clinica VARCHAR,
  p_indirizzo_clinica TEXT,
  p_telefono VARCHAR DEFAULT NULL,
  p_email_clinica VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  profilo_id UUID,
  fisioterapista_id UUID,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_profilo_id UUID;
  v_fisio_id UUID;
  v_password_hash VARCHAR;
BEGIN
  -- Verifica se email già esiste
  IF EXISTS (SELECT 1 FROM profili WHERE email = p_email) THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, FALSE, 'Email già registrata'::TEXT;
    RETURN;
  END IF;

  -- Verifica se numero albo già esiste
  IF EXISTS (SELECT 1 FROM fisioterapisti WHERE numero_albo = p_numero_albo) THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, FALSE, 'Numero albo già registrato'::TEXT;
    RETURN;
  END IF;

  -- Hash password
  v_password_hash := hash_password(p_password);

  -- Crea profilo
  INSERT INTO profili (ruolo, nome, cognome, email, password_hash)
  VALUES ('fisioterapista', p_nome, p_cognome, p_email, v_password_hash)
  RETURNING id INTO v_profilo_id;

  -- Crea record fisioterapista
  INSERT INTO fisioterapisti (
    profilo_id, numero_albo, specializzazione, nome_clinica,
    indirizzo_clinica, telefono, email_clinica
  )
  VALUES (
    v_profilo_id, p_numero_albo, p_specializzazione, p_nome_clinica,
    p_indirizzo_clinica, p_telefono, p_email_clinica
  )
  RETURNING id INTO v_fisio_id;

  RETURN QUERY SELECT v_profilo_id, v_fisio_id, TRUE, 'Registrazione completata'::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION registra_fisioterapista IS 'Registra un nuovo fisioterapista nel sistema';

-- =====================================================
-- FUNZIONE: Registrazione paziente da parte di fisioterapista
-- =====================================================
CREATE OR REPLACE FUNCTION registra_paziente(
  p_fisioterapista_id UUID,
  p_nome VARCHAR,
  p_cognome VARCHAR,
  p_data_nascita DATE,
  p_codice_fiscale VARCHAR,
  p_diagnosi TEXT,
  p_piano_terapeutico TEXT,
  p_telefono VARCHAR DEFAULT NULL,
  p_note TEXT DEFAULT NULL
)
RETURNS TABLE (
  profilo_id UUID,
  paziente_id UUID,
  password_generata VARCHAR,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_profilo_id UUID;
  v_paziente_id UUID;
  v_password VARCHAR;
  v_password_hash VARCHAR;
  v_cf_normalizzato VARCHAR;
BEGIN
  -- Normalizza codice fiscale (uppercase)
  v_cf_normalizzato := UPPER(p_codice_fiscale);

  -- Valida codice fiscale
  IF NOT valida_codice_fiscale(v_cf_normalizzato) THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::VARCHAR, FALSE, 'Codice fiscale non valido'::TEXT;
    RETURN;
  END IF;

  -- Verifica se codice fiscale già esiste
  IF EXISTS (SELECT 1 FROM pazienti WHERE codice_fiscale = v_cf_normalizzato) THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::VARCHAR, FALSE, 'Codice fiscale già registrato'::TEXT;
    RETURN;
  END IF;

  -- Genera password dalle prime 5 lettere del CF
  v_password := genera_password_da_cf(v_cf_normalizzato);
  v_password_hash := hash_password(v_password);

  -- Crea profilo paziente (email opzionale, usa CF@temp.local come placeholder)
  INSERT INTO profili (ruolo, nome, cognome, email, password_hash)
  VALUES ('paziente', p_nome, p_cognome, v_cf_normalizzato || '@temp.local', v_password_hash)
  RETURNING id INTO v_profilo_id;

  -- Crea record paziente
  INSERT INTO pazienti (
    profilo_id, fisioterapista_id, nome_paziente, cognome_paziente,
    data_nascita, codice_fiscale, telefono, diagnosi, piano_terapeutico, note
  )
  VALUES (
    v_profilo_id, p_fisioterapista_id, p_nome, p_cognome,
    p_data_nascita, v_cf_normalizzato, p_telefono, p_diagnosi, p_piano_terapeutico, p_note
  )
  RETURNING id INTO v_paziente_id;

  RETURN QUERY SELECT v_profilo_id, v_paziente_id, v_password, TRUE, 'Paziente registrato con successo'::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION registra_paziente IS 'Registra un nuovo paziente nel sistema con password auto-generata';

-- =====================================================
-- FUNZIONE: Login fisioterapista con email
-- =====================================================
CREATE OR REPLACE FUNCTION login_fisioterapista(
  p_email VARCHAR,
  p_password VARCHAR
)
RETURNS TABLE (
  profilo_id UUID,
  fisioterapista_id UUID,
  nome VARCHAR,
  cognome VARCHAR,
  email VARCHAR,
  numero_albo VARCHAR,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_profilo profili%ROWTYPE;
  v_fisio fisioterapisti%ROWTYPE;
BEGIN
  -- Cerca profilo per email
  SELECT * INTO v_profilo
  FROM profili
  WHERE profili.email = p_email
    AND ruolo = 'fisioterapista';

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

  -- Ottieni dati fisioterapista
  SELECT * INTO v_fisio
  FROM fisioterapisti f
  WHERE f.profilo_id = v_profilo.id;

  RETURN QUERY SELECT
    v_profilo.id,
    v_fisio.id,
    v_profilo.nome,
    v_profilo.cognome,
    v_profilo.email,
    v_fisio.numero_albo,
    TRUE,
    'Login effettuato'::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION login_fisioterapista IS 'Autentica un fisioterapista tramite email e password';

-- =====================================================
-- FUNZIONE: Login paziente con codice fiscale
-- =====================================================
CREATE OR REPLACE FUNCTION login_paziente(
  p_codice_fiscale VARCHAR,
  p_password VARCHAR
)
RETURNS TABLE (
  profilo_id UUID,
  paziente_id UUID,
  fisioterapista_id UUID,
  nome VARCHAR,
  cognome VARCHAR,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_profilo profili%ROWTYPE;
  v_paziente pazienti%ROWTYPE;
  v_cf_normalizzato VARCHAR;
BEGIN
  -- Normalizza codice fiscale
  v_cf_normalizzato := UPPER(p_codice_fiscale);

  -- Cerca paziente per codice fiscale
  SELECT p.* INTO v_paziente
  FROM pazienti p
  WHERE p.codice_fiscale = v_cf_normalizzato
    AND p.attivo = TRUE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::UUID, NULL::VARCHAR,
                        NULL::VARCHAR, FALSE, 'Credenziali non valide'::TEXT;
    RETURN;
  END IF;

  -- Ottieni profilo
  SELECT * INTO v_profilo
  FROM profili
  WHERE id = v_paziente.profilo_id;

  -- Verifica password
  IF NOT verifica_password(p_password, v_profilo.password_hash) THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::UUID, NULL::VARCHAR,
                        NULL::VARCHAR, FALSE, 'Credenziali non valide'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    v_profilo.id,
    v_paziente.id,
    v_paziente.fisioterapista_id,
    v_profilo.nome,
    v_profilo.cognome,
    TRUE,
    'Login effettuato'::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION login_paziente IS 'Autentica un paziente tramite codice fiscale e password';

-- =====================================================
-- FUNZIONE: Cambia password utente
-- =====================================================
CREATE OR REPLACE FUNCTION cambia_password(
  p_profilo_id UUID,
  p_vecchia_password VARCHAR,
  p_nuova_password VARCHAR
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_password_hash_attuale VARCHAR;
  v_nuovo_hash VARCHAR;
BEGIN
  -- Ottieni hash password attuale
  SELECT password_hash INTO v_password_hash_attuale
  FROM profili
  WHERE id = p_profilo_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Utente non trovato'::TEXT;
    RETURN;
  END IF;

  -- Verifica vecchia password
  IF NOT verifica_password(p_vecchia_password, v_password_hash_attuale) THEN
    RETURN QUERY SELECT FALSE, 'Password attuale non corretta'::TEXT;
    RETURN;
  END IF;

  -- Valida nuova password (minimo 5 caratteri)
  IF LENGTH(p_nuova_password) < 5 THEN
    RETURN QUERY SELECT FALSE, 'La nuova password deve essere di almeno 5 caratteri'::TEXT;
    RETURN;
  END IF;

  -- Hash nuova password
  v_nuovo_hash := hash_password(p_nuova_password);

  -- Aggiorna password
  UPDATE profili
  SET password_hash = v_nuovo_hash,
      data_aggiornamento = NOW()
  WHERE id = p_profilo_id;

  RETURN QUERY SELECT TRUE, 'Password modificata con successo'::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cambia_password IS 'Modifica la password di un utente previa verifica della password attuale';

-- =====================================================
-- FUNZIONE: Reset password paziente (da parte fisioterapista)
-- =====================================================
CREATE OR REPLACE FUNCTION reset_password_paziente(
  p_fisioterapista_id UUID,
  p_paziente_id UUID
)
RETURNS TABLE (
  nuova_password VARCHAR,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_paziente pazienti%ROWTYPE;
  v_nuova_password VARCHAR;
  v_nuovo_hash VARCHAR;
BEGIN
  -- Verifica che il fisioterapista abbia accesso al paziente
  IF NOT fisioterapista_ha_accesso_paziente(p_fisioterapista_id, p_paziente_id) THEN
    RETURN QUERY SELECT NULL::VARCHAR, FALSE, 'Accesso negato'::TEXT;
    RETURN;
  END IF;

  -- Ottieni dati paziente
  SELECT * INTO v_paziente
  FROM pazienti
  WHERE id = p_paziente_id;

  -- Rigenera password dal codice fiscale
  v_nuova_password := genera_password_da_cf(v_paziente.codice_fiscale);
  v_nuovo_hash := hash_password(v_nuova_password);

  -- Aggiorna password nel profilo
  UPDATE profili
  SET password_hash = v_nuovo_hash,
      data_aggiornamento = NOW()
  WHERE id = v_paziente.profilo_id;

  RETURN QUERY SELECT v_nuova_password, TRUE, 'Password resettata con successo'::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reset_password_paziente IS 'Resetta la password di un paziente alla password iniziale (prime 5 lettere CF)';

-- =====================================================
-- FUNZIONE: Ottieni dati profilo completo
-- =====================================================
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
  IF v_profilo.ruolo = 'fisioterapista' THEN
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

COMMENT ON FUNCTION get_profilo_completo IS 'Restituisce il profilo completo con dati specifici per ruolo';
