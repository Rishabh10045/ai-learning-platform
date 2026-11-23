-- Day 15 · Pessimistic and optimistic locking. Two real connections: this session ("A") and dblink ("B").
CREATE EXTENSION IF NOT EXISTS dblink;
SELECT 'connection B', dblink_connect('b', format('host=%s port=%s dbname=%s user=%s',
  split_part(current_setting('unix_socket_directories'), ',', 1), current_setting('port'), current_database(), current_user));

\echo '-- pessimistic: A holds the row lock with SELECT ... FOR UPDATE until it commits'
BEGIN;
SELECT 'A locks A1 FOR UPDATE, owner', coalesce(owner, 'free') FROM seat WHERE id = 'A1' FOR UPDATE;
SELECT 'B: lock_timeout 200ms then FOR UPDATE', try_sql($$SELECT * FROM dblink('b', 'SET lock_timeout = ''200ms''; SELECT owner FROM seat WHERE id = ''A1'' FOR UPDATE') AS t(o text)$$);
SELECT 'B: FOR UPDATE NOWAIT', try_sql($$SELECT * FROM dblink('b', 'SELECT owner FROM seat WHERE id = ''A1'' FOR UPDATE NOWAIT') AS t(o text)$$);
SELECT 'B: FOR UPDATE SKIP LOCKED returns rows', (SELECT count(*) FROM dblink('b', $$SELECT id FROM seat WHERE id IN ('A1', 'A2') FOR UPDATE SKIP LOCKED$$) AS t(id text));
UPDATE seat SET owner = 'U1' WHERE id = 'A1';
COMMIT;
SELECT 'after A commits, B locks A1 and sees owner', (SELECT o FROM dblink('b', $$SELECT owner FROM seat WHERE id = 'A1' FOR UPDATE$$) AS t(o text));

\echo '-- optimistic: no lock while the user decides; the UPDATE checks the version it read'
SELECT 'A reads A2 version', version FROM seat WHERE id = 'A2';
SELECT 'B reads A2 version', (SELECT v FROM dblink('b', $$SELECT version FROM seat WHERE id = 'A2'$$) AS t(v int));
SELECT 'A: UPDATE ... WHERE version = 0 rows', rows_changed($$UPDATE seat SET owner = 'U1', version = version + 1 WHERE id = 'A2' AND version = 0$$);
SELECT 'B: UPDATE ... WHERE version = 0 rows', (SELECT n FROM dblink('b', $$SELECT rows_changed('UPDATE seat SET owner = ''U2'', version = version + 1 WHERE id = ''A2'' AND version = 0')$$) AS t(n bigint));
SELECT 'stored A2', owner || ' at version ' || version FROM seat WHERE id = 'A2';
SELECT 'close', dblink_disconnect('b');
