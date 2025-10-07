-- =====================================================
-- ESTENSIONI POSTGRESQL
-- =====================================================
-- Questo script abilita le estensioni necessarie per il database
-- Da eseguire come primo script

-- Estensione per UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Estensione per funzioni crittografiche (per hash password)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
