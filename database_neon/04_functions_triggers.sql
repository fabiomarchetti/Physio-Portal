-- =====================================================
-- FUNZIONI E TRIGGER
-- =====================================================
-- Script per funzioni helper e trigger automatici

-- =====================================================
-- FUNZIONE: Aggiornamento automatico timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_aggiornamento = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Aggiorna automaticamente il campo data_aggiornamento';

-- =====================================================
-- TRIGGER: Aggiornamento timestamp profili
-- =====================================================
CREATE TRIGGER trigger_update_profili_timestamp
  BEFORE UPDATE ON profili
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER: Aggiornamento timestamp configurazioni_sistema
-- =====================================================
CREATE TRIGGER trigger_update_configurazioni_timestamp
  BEFORE UPDATE ON configurazioni_sistema
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNZIONE: Calcolo durata sessione
-- =====================================================
CREATE OR REPLACE FUNCTION calcola_durata_sessione()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.data_fine IS NOT NULL AND NEW.data_inizio IS NOT NULL THEN
    NEW.durata_minuti = EXTRACT(EPOCH FROM (NEW.data_fine - NEW.data_inizio)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcola_durata_sessione() IS 'Calcola automaticamente la durata della sessione in minuti';

-- =====================================================
-- TRIGGER: Calcolo durata sessione automatico
-- =====================================================
CREATE TRIGGER trigger_calcola_durata_sessione
  BEFORE INSERT OR UPDATE ON sessioni_riabilitazione
  FOR EACH ROW
  EXECUTE FUNCTION calcola_durata_sessione();

-- =====================================================
-- FUNZIONE: Validazione codice fiscale italiano
-- =====================================================
CREATE OR REPLACE FUNCTION valida_codice_fiscale(cf VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  -- Controllo lunghezza (16 caratteri)
  IF LENGTH(cf) != 16 THEN
    RETURN FALSE;
  END IF;

  -- Controllo formato base (uppercase alfanumerico)
  IF cf !~ '^[A-Z0-9]{16}$' THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION valida_codice_fiscale(VARCHAR) IS 'Valida il formato base del codice fiscale italiano';

-- =====================================================
-- FUNZIONE: Genera password iniziale da codice fiscale
-- =====================================================
CREATE OR REPLACE FUNCTION genera_password_da_cf(cf VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
  -- Prime 5 lettere del codice fiscale in minuscolo
  RETURN LOWER(SUBSTRING(cf, 1, 5));
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION genera_password_da_cf(VARCHAR) IS 'Genera password iniziale dalle prime 5 lettere del codice fiscale';

-- =====================================================
-- FUNZIONE: Hash password con bcrypt
-- =====================================================
CREATE OR REPLACE FUNCTION hash_password(password VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION hash_password(VARCHAR) IS 'Crea hash bcrypt della password';

-- =====================================================
-- FUNZIONE: Verifica password
-- =====================================================
CREATE OR REPLACE FUNCTION verifica_password(password VARCHAR, password_hash VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN password_hash = crypt(password, password_hash);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION verifica_password(VARCHAR, VARCHAR) IS 'Verifica se la password corrisponde all hash';

-- =====================================================
-- FUNZIONE: Ottieni statistiche sessioni paziente
-- =====================================================
CREATE OR REPLACE FUNCTION get_statistiche_paziente(p_paziente_id UUID)
RETURNS TABLE (
  totale_sessioni BIGINT,
  sessioni_completate BIGINT,
  sessioni_attive BIGINT,
  media_punteggio DECIMAL(5,2),
  durata_totale_minuti INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS totale_sessioni,
    COUNT(*) FILTER (WHERE stato = 'completata') AS sessioni_completate,
    COUNT(*) FILTER (WHERE stato = 'attiva') AS sessioni_attive,
    AVG(punteggio_finale) AS media_punteggio,
    SUM(durata_minuti)::INTEGER AS durata_totale_minuti
  FROM sessioni_riabilitazione
  WHERE paziente_id = p_paziente_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_statistiche_paziente(UUID) IS 'Restituisce statistiche aggregate per un paziente';

-- =====================================================
-- FUNZIONE: Ottieni metriche sessione per tipo
-- =====================================================
CREATE OR REPLACE FUNCTION get_metriche_per_tipo(
  p_sessione_id UUID,
  p_tipo_metrica VARCHAR
)
RETURNS TABLE (
  id UUID,
  valore_metrica DECIMAL(10,4),
  unita_misura VARCHAR(20),
  articolazione VARCHAR(50),
  timestamp_calcolo TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.valore_metrica,
    m.unita_misura,
    m.articolazione,
    m.timestamp_calcolo
  FROM metriche_sessione m
  WHERE m.sessione_id = p_sessione_id
    AND m.tipo_metrica = p_tipo_metrica
  ORDER BY m.timestamp_calcolo DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_metriche_per_tipo(UUID, VARCHAR) IS 'Restituisce metriche filtrate per tipo per una sessione';

-- =====================================================
-- FUNZIONE: Conteggio pazienti attivi per fisioterapista
-- =====================================================
CREATE OR REPLACE FUNCTION get_pazienti_attivi_fisio(p_fisioterapista_id UUID)
RETURNS INTEGER AS $$
DECLARE
  conteggio INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO conteggio
  FROM pazienti
  WHERE fisioterapista_id = p_fisioterapista_id
    AND attivo = TRUE;

  RETURN conteggio;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_pazienti_attivi_fisio(UUID) IS 'Restituisce il numero di pazienti attivi per un fisioterapista';

-- =====================================================
-- FUNZIONE: Ottieni sessioni recenti paziente
-- =====================================================
CREATE OR REPLACE FUNCTION get_sessioni_recenti(
  p_paziente_id UUID,
  p_limite INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  data_inizio TIMESTAMPTZ,
  data_fine TIMESTAMPTZ,
  durata_minuti INTEGER,
  tipo_esercizio VARCHAR(200),
  stato VARCHAR(20),
  punteggio_finale DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.data_inizio,
    s.data_fine,
    s.durata_minuti,
    s.tipo_esercizio,
    s.stato,
    s.punteggio_finale
  FROM sessioni_riabilitazione s
  WHERE s.paziente_id = p_paziente_id
  ORDER BY s.data_inizio DESC
  LIMIT p_limite;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_sessioni_recenti(UUID, INTEGER) IS 'Restituisce le sessioni più recenti di un paziente';

-- =====================================================
-- FUNZIONE: Verifica se fisioterapista ha accesso a paziente
-- =====================================================
CREATE OR REPLACE FUNCTION fisioterapista_ha_accesso_paziente(
  p_fisioterapista_id UUID,
  p_paziente_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  ha_accesso BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM pazienti p
    WHERE p.id = p_paziente_id
      AND p.fisioterapista_id = p_fisioterapista_id
  ) INTO ha_accesso;

  RETURN ha_accesso;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fisioterapista_ha_accesso_paziente(UUID, UUID) IS 'Verifica se un fisioterapista ha accesso a un paziente';

-- =====================================================
-- FUNZIONE: Aggiorna stato obiettivo in base a progresso
-- =====================================================
CREATE OR REPLACE FUNCTION aggiorna_stato_obiettivo(
  p_obiettivo_id UUID,
  p_valore_attuale DECIMAL
)
RETURNS VOID AS $$
DECLARE
  v_valore_target DECIMAL;
BEGIN
  SELECT valore_target INTO v_valore_target
  FROM obiettivi_terapeutici
  WHERE id = p_obiettivo_id;

  IF v_valore_target IS NOT NULL AND p_valore_attuale >= v_valore_target THEN
    UPDATE obiettivi_terapeutici
    SET stato = 'raggiunto'
    WHERE id = p_obiettivo_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION aggiorna_stato_obiettivo(UUID, DECIMAL) IS 'Aggiorna automaticamente lo stato di un obiettivo in base al valore raggiunto';
