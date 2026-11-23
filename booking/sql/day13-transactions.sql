-- Day 13 · JDBC and database transactions (the SQL your JDBC code sends). Each line prints "label | result".
CREATE TABLE payment (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, seat_id text NOT NULL, amount integer NOT NULL CHECK (amount > 0));
CREATE EXTENSION IF NOT EXISTS dblink;
SELECT 'second connection', dblink_connect('other', format('host=%s port=%s dbname=%s user=%s',
  split_part(current_setting('unix_socket_directories'), ',', 1), current_setting('port'), current_database(), current_user));

\echo '-- commit keeps both rows of one unit of work'
BEGIN;
INSERT INTO booking (seat_id, user_id, status) VALUES ('A1', 'U1', 'CONFIRMED');
INSERT INTO payment (seat_id, amount) VALUES ('A1', 450);
SELECT 'other connection sees A1 before commit', (SELECT n FROM dblink('other', $$SELECT count(*) FROM booking WHERE seat_id = 'A1'$$) AS t(n bigint));
COMMIT;
SELECT 'other connection sees A1 after commit', (SELECT n FROM dblink('other', $$SELECT count(*) FROM booking WHERE seat_id = 'A1'$$) AS t(n bigint));

\echo '-- rollback undoes both rows'
BEGIN;
INSERT INTO booking (seat_id, user_id, status) VALUES ('A2', 'U2', 'CONFIRMED');
SELECT 'payment with amount 0', try_sql($$INSERT INTO payment (seat_id, amount) VALUES ('A2', 0)$$);
ROLLBACK;
SELECT 'A2 rows after rollback', (SELECT count(*) FROM booking WHERE seat_id = 'A2') || ' booking, ' || (SELECT count(*) FROM payment WHERE seat_id = 'A2') || ' payment';

\echo '-- isolation: this session reads A3 twice while the other connection commits a change in between'
BEGIN ISOLATION LEVEL READ COMMITTED;
SELECT 'READ COMMITTED  first read', coalesce(owner, 'free') FROM seat WHERE id = 'A3';
SELECT 'other connection sets owner', dblink_exec('other', $$UPDATE seat SET owner = 'U7' WHERE id = 'A3'$$);
SELECT 'READ COMMITTED  second read', coalesce(owner, 'free') FROM seat WHERE id = 'A3';
COMMIT;
UPDATE seat SET owner = NULL WHERE id = 'A3';
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT 'REPEATABLE READ first read', coalesce(owner, 'free') FROM seat WHERE id = 'A3';
SELECT 'other connection sets owner', dblink_exec('other', $$UPDATE seat SET owner = 'U8' WHERE id = 'A3'$$);
SELECT 'REPEATABLE READ second read', coalesce(owner, 'free') FROM seat WHERE id = 'A3';
SELECT 'REPEATABLE READ tries to update A3', try_sql($$UPDATE seat SET owner = 'U9' WHERE id = 'A3'$$);
ROLLBACK;
SELECT 'stored owner of A3', owner FROM seat WHERE id = 'A3';
SELECT 'close', dblink_disconnect('other');
