-- Day 16 · JPA mapping and integration tests: the SQL an ORM issues, run against real PostgreSQL.
INSERT INTO booking (seat_id, user_id, status) VALUES ('A1', 'U1', 'HELD'), ('A2', 'U2', 'HELD'), ('A3', 'U3', 'HELD'), ('B1', 'U4', 'HELD');

\echo '-- N+1: one query for the list, then one query per booking for its seat'
CREATE TEMP TABLE query_log (n int);
DO $$ DECLARE b record; s record; BEGIN
  INSERT INTO query_log VALUES (1);                                           -- SELECT * FROM booking
  FOR b IN SELECT * FROM booking LOOP
    INSERT INTO query_log VALUES (1);                                         -- SELECT * FROM seat WHERE id = ?
    SELECT * INTO s FROM seat WHERE id = b.seat_id;
  END LOOP;
END $$;
SELECT 'N+1 queries for 4 bookings', sum(n) FROM query_log;
SELECT 'join fetch: 1 query returns rows', count(*) FROM booking b JOIN seat s ON s.id = b.seat_id;

\echo '-- @Version: the UPDATE carries the version that was loaded'
SELECT 'tx1 confirms booking 1 (loaded v0) rows', rows_changed($$UPDATE booking SET status = 'CONFIRMED', version = version + 1 WHERE id = 1 AND version = 0$$);
SELECT 'tx2 cancels booking 1 (loaded v0) rows', rows_changed($$UPDATE booking SET status = 'CANCELLED', version = version + 1 WHERE id = 1 AND version = 0$$);
SELECT 'stored booking 1', status || ' v' || version FROM booking WHERE id = 1;

\echo '-- why the integration test needs PostgreSQL: rules that live only in this database'
SELECT 'second active booking for A2', try_sql($$INSERT INTO booking (seat_id, user_id, status) VALUES ('A2', 'U9', 'HELD')$$);
SELECT 'partial index exists', indexdef LIKE '%WHERE (status = ANY%' FROM pg_indexes WHERE indexname = 'one_active_booking_per_seat';
