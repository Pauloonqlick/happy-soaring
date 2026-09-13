-- Fase 5 (fim) — avisos críticos por email.
--
-- Só acontecimentos críticos, para o endereço configurado. No máximo um aviso
-- agregado por dia, salvo situação excepcional (página prioritária ou vários
-- problemas críticos ao mesmo tempo). Tudo o resto aparece no «Hoje».
-- O envio é pelo Resend; a chave é um segredo do Worker e nunca vive aqui.

CREATE TABLE avisos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  criado_em      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  motivo         TEXT NOT NULL CHECK (motivo IN ('DIARIO', 'EXCEPCIONAL', 'TESTE')),
  assuntos       TEXT NOT NULL,                  -- JSON: [{chave, detectado_em}] avisados
  estado         TEXT NOT NULL CHECK (estado IN ('ENVIADO', 'FALHOU')),
  id_fornecedor  TEXT,
  erro           TEXT                            -- só o código devolvido; nunca credenciais
);
CREATE INDEX avisos_por_data ON avisos (estado, criado_em);

UPDATE esquema_meta SET valor = '6' WHERE chave = 'versao_esquema';
