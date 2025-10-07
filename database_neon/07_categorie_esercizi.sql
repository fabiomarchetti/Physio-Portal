-- =====================================================
-- TABELLA: categorie_esercizi
-- Descrizione: Categorie per organizzare gli esercizi riabilitativi
-- =====================================================
-- NOTA: Questa tabella mancava nella migrazione iniziale da Supabase

CREATE TABLE IF NOT EXISTS categorie_esercizi (
  id_categoria SERIAL PRIMARY KEY,
  nome_categoria VARCHAR(200) NOT NULL UNIQUE,
  img_categoria VARCHAR(500) NOT NULL DEFAULT 'default_category.svg',
  data_creazione TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_aggiornamento TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE categorie_esercizi IS 'Categorie per organizzare gli esercizi riabilitativi';
COMMENT ON COLUMN categorie_esercizi.id_categoria IS 'ID numerico progressivo (SERIAL)';
COMMENT ON COLUMN categorie_esercizi.nome_categoria IS 'Nome della categoria (es. Spalla, Ginocchio, Mano)';
COMMENT ON COLUMN categorie_esercizi.img_categoria IS 'Path immagine SVG della categoria';

-- Trigger per aggiornare automaticamente data_aggiornamento
CREATE TRIGGER trigger_update_categorie_timestamp
  BEFORE UPDATE ON categorie_esercizi
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MODIFICA TABELLA tipi_esercizio
-- Aggiungi relazione con categorie_esercizi
-- =====================================================

-- Aggiungi colonna id_categoria se non esiste
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tipi_esercizio' AND column_name = 'id_categoria'
  ) THEN
    ALTER TABLE tipi_esercizio ADD COLUMN id_categoria INTEGER;
    ALTER TABLE tipi_esercizio ADD CONSTRAINT fk_categoria
      FOREIGN KEY (id_categoria) REFERENCES categorie_esercizi(id_categoria) ON DELETE SET NULL;

    CREATE INDEX idx_tipi_esercizio_categoria ON tipi_esercizio(id_categoria);
  END IF;
END $$;

-- Aggiungi colonne legacy per compatibilità con codice esistente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tipi_esercizio' AND column_name = 'id_esercizio'
  ) THEN
    ALTER TABLE tipi_esercizio ADD COLUMN id_esercizio SERIAL;
    CREATE UNIQUE INDEX idx_tipi_esercizio_id_esercizio ON tipi_esercizio(id_esercizio);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tipi_esercizio' AND column_name = 'nome_esercizio'
  ) THEN
    ALTER TABLE tipi_esercizio RENAME COLUMN nome_esercizio TO nome_esercizio;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tipi_esercizio' AND column_name = 'descrizione_esecuzione'
  ) THEN
    ALTER TABLE tipi_esercizio ADD COLUMN descrizione_esecuzione TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tipi_esercizio' AND column_name = 'landmark'
  ) THEN
    ALTER TABLE tipi_esercizio ADD COLUMN landmark INTEGER[];
  END IF;
END $$;

-- =====================================================
-- DATI INIZIALI - Categorie Base
-- =====================================================
INSERT INTO categorie_esercizi (nome_categoria, img_categoria) VALUES
  ('Spalla', 'spalla.svg'),
  ('Gomito', 'gomito.svg'),
  ('Polso', 'polso.svg'),
  ('Mano', 'mano.svg'),
  ('Anca', 'anca.svg'),
  ('Ginocchio', 'ginocchio.svg'),
  ('Caviglia', 'caviglia.svg'),
  ('Colonna Vertebrale', 'colonna.svg'),
  ('Collo', 'collo.svg'),
  ('Corpo Completo', 'corpo.svg')
ON CONFLICT (nome_categoria) DO NOTHING;

COMMENT ON TABLE categorie_esercizi IS 'Categorie organizzative per gli esercizi - ripristinata da Supabase';
