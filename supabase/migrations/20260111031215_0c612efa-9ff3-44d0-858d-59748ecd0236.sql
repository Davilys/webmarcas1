-- Adicionar coluna neighborhood para salvar bairro
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS neighborhood TEXT;

-- Adicionar coluna para arquivo OTS do blockchain
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS ots_file_url TEXT;