-- 0001_convert_due_date_to_yyyymmdd.sql
-- Converte epochDay (timezone-dependente, off-by-1 bug) para YYYYMMDD (timezone-independente).
-- Adiciona +1 day porque o epochDay antigo representava a meia-noite UTC do dia ANTERIOR
-- ao dia local pretendido (devido a Math.floor perder precisão).
-- Em DBs vazios (fresh install), o UPDATE é no-op.

UPDATE tasks SET due_date = CAST(
  strftime('%Y%m%d', due_date * 86400000, 'unixepoch', 'localtime', '+1 day')
  AS INTEGER
) WHERE due_date IS NOT NULL;
