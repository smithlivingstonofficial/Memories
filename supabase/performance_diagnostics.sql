-- Performance diagnostics for Memories.
-- Run in Supabase SQL Editor after enabling pg_stat_statements if needed.
-- These queries are read-only.

-- 1. Most frequently called queries.
select
  calls,
  round((total_exec_time + total_plan_time)::numeric, 2) as total_ms,
  round((mean_exec_time + mean_plan_time)::numeric, 2) as mean_ms,
  round((max_exec_time + max_plan_time)::numeric, 2) as max_ms,
  rows,
  left(query, 240) as query_sample
from pg_stat_statements
order by calls desc
limit 30;

-- 2. Slowest query outliers.
select
  calls,
  round((total_exec_time + total_plan_time)::numeric, 2) as total_ms,
  round((mean_exec_time + mean_plan_time)::numeric, 2) as mean_ms,
  round((max_exec_time + max_plan_time)::numeric, 2) as max_ms,
  rows,
  left(query, 240) as query_sample
from pg_stat_statements
order by (max_exec_time + max_plan_time) desc
limit 30;

-- 3. Tables with sequential scans.
select
  schemaname,
  relname,
  seq_scan,
  seq_tup_read,
  idx_scan,
  n_live_tup
from pg_stat_user_tables
where schemaname = 'public'
order by seq_tup_read desc
limit 30;

-- 4. Index usage.
select
  schemaname,
  relname,
  indexrelname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
from pg_stat_user_indexes
where schemaname = 'public'
order by idx_scan asc, idx_tup_read desc
limit 50;

-- 5. Table sizes.
select
  relname,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size,
  pg_size_pretty(pg_relation_size(relid)) as table_size,
  n_live_tup
from pg_stat_user_tables
where schemaname = 'public'
order by pg_total_relation_size(relid) desc;

-- 6. Realtime publication coverage.
select
  pubname,
  schemaname,
  tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
order by schemaname, tablename;
