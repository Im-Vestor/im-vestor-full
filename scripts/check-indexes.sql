-- Script para verificar índices no banco de dados
-- Execute com: psql $DATABASE_URL -f scripts/check-indexes.sql

\echo '========================================='
\echo 'VERIFICAÇÃO DE ÍNDICES - IM-VESTOR'
\echo '========================================='
\echo ''

-- 1. Verificar índices na tabela ProjectView
\echo '1. Índices em ProjectView:'
\echo '-----------------------------------------'
\d+ "ProjectView"
\echo ''

-- 2. Verificar índices na tabela Negotiation
\echo '2. Índices em Negotiation:'
\echo '-----------------------------------------'
\d+ "Negotiation"
\echo ''

-- 3. Verificar índices na tabela Project
\echo '3. Índices em Project:'
\echo '-----------------------------------------'
\d+ "Project"
\echo ''

-- 4. Verificar índices na tabela Meeting
\echo '4. Índices em Meeting:'
\echo '-----------------------------------------'
\d+ "Meeting"
\echo ''

-- 5. Verificar índices na tabela Notification
\echo '5. Índices em Notification:'
\echo '-----------------------------------------'
\d+ "Notification"
\echo ''

-- 6. Verificar índices na tabela Connection
\echo '6. Índices em Connection:'
\echo '-----------------------------------------'
\d+ "Connection"
\echo ''

-- 7. Verificar índices na tabela Referral
\echo '7. Índices em Referral:'
\echo '-----------------------------------------'
\d+ "Referral"
\echo ''

-- 8. Listar TODOS os índices no schema public
\echo '8. TODOS os índices no schema public:'
\echo '-----------------------------------------'
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
\echo ''

-- 9. Verificar tamanho das tabelas e índices
\echo '9. Tamanho das tabelas e seus índices:'
\echo '-----------------------------------------'
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
\echo ''

-- 10. Verificar índices não utilizados (potencialmente)
\echo '10. Estatísticas de uso dos índices:'
\echo '-----------------------------------------'
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC
LIMIT 20;
\echo ''

\echo '========================================='
\echo 'VERIFICAÇÃO CONCLUÍDA'
\echo '========================================='
