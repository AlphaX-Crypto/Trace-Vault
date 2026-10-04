-- 018_make_evidence_analysis_id_nullable.sql
-- Allows manually or directly submitted evidentiary items attached to a case without requiring a pre-run Python analysis_id
ALTER TABLE evidence ALTER COLUMN analysis_id DROP NOT NULL;
