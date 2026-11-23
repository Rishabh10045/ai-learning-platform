-- Day 14 · Atomic SQL updates. Two real connections: this psql session ("A") and a dblink connection ("B").
CREATE EXTENSION IF NOT EXISTS dblink;
SELECT 'connection B', dblink_connect('b', format('host=%s port=%s dbname=%s user=%s',
  split_part(current_setting('unix_socket_directories'), ',', 1), current_setting('port'), current_database(), current_user));

\echo '-- broken: both read "free", then both run an unconditional UPDATE'
SELECT 'A reads A1', coalesce(owner, 'free') FROM seat WHERE id = 'A1';
SELECT 'B reads A1', (SELECT coalesce(o, 'free') FROM dblink('b', $$SELECT owner FROM seat WHERE id = 'A1'$$) AS t(o text));
SELECT 'A: UPDATE seat SET owner=U1 rows', rows_changed($$UPDATE seat SET owner = 'U1' WHERE id = 'A1'$$);
SELECT 'B: UPDATE seat SET owner=U2 rows', (SELECT n FROM dblink('b', $$SELECT rows_changed('UPDATE seat SET owner = ''U2'' WHERE id = ''A1''')$$) AS t(n bigint));
SELECT 'stored owner (U1 was told it won)', owner FROM seat WHERE id = 'A1';

\echo '-- fixed: the check is inside the UPDATE; B runs while A still holds the row lock'
BEGIN;
SELECT 'A: conditional UPDATE rows', rows_changed($$UPDATE seat SET owner = 'U1' WHERE id = 'A2' AND owner IS NULL$$);
SELECT 'B sends its conditional UPDATE', dblink_send_query('b', $$SELECT rows_changed('UPDATE seat SET owner = ''U2'' WHERE id = ''A2'' AND owner IS NULL')$$);
SELECT 'wait 300 ms' FROM pg_sleep(0.3);
SELECT 'B is still waiting for the row lock', dblink_is_busy('b') = 1;
COMMIT;
SELECT 'B: conditional UPDATE rows (after A committed)', (SELECT n FROM dblink_get_result('b') AS t(n bigint));
SELECT 'drain', count(*) FROM dblink_get_result('b') AS t(n bigint);
SELECT 'stored owner of A2', owner FROM seat WHERE id = 'A2';

\echo '-- the application maps rows changed to the reply'
SELECT 'reply when rows = 1', CASE rows_changed($$UPDATE seat SET owner = 'U3' WHERE id = 'A3' AND owner IS NULL$$) WHEN 1 THEN '201 Created' ELSE '409 Conflict' END;
SELECT 'reply when rows = 0', CASE rows_changed($$UPDATE seat SET owner = 'U4' WHERE id = 'A3' AND owner IS NULL$$) WHEN 1 THEN '201 Created' ELSE '409 Conflict' END;
SELECT 'close', dblink_disconnect('b');
