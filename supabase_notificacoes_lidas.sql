-- Adicionar coluna 'lida' à tabela notificacoes
ALTER TABLE notificacoes ADD COLUMN lida BOOLEAN DEFAULT FALSE;

-- Criar índice para melhorar queries de notificações não lidas
CREATE INDEX idx_notificacoes_lida ON notificacoes(ativo, lida);
