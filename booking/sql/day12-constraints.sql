-- Day 12 · SQL and schema constraints. Each line prints "label | result".
\echo '-- constraints reject bad rows at the database, whatever code sent them'
SELECT 'valid booking A1/U1', try_sql($$INSERT INTO booking (seat_id, user_id, status) VALUES ('A1', 'U1', 'CONFIRMED')$$);
SELECT 'second active booking for A1', try_sql($$INSERT INTO booking (seat_id, user_id, status) VALUES ('A1', 'U2', 'HELD')$$);
SELECT 'unknown seat Z9', try_sql($$INSERT INTO booking (seat_id, user_id, status) VALUES ('Z9', 'U1', 'HELD')$$);
SELECT 'status PAID', try_sql($$INSERT INTO booking (seat_id, user_id, status) VALUES ('A2', 'U1', 'PAID')$$);
SELECT 'blank user', try_sql($$INSERT INTO booking (seat_id, user_id, status) VALUES ('A2', '  ', 'HELD')$$);
SELECT 'null user', try_sql($$INSERT INTO booking (seat_id, status) VALUES ('A2', 'HELD')$$);
SELECT 'bad seat id a-1', try_sql($$INSERT INTO seat (id, show_id) VALUES ('a-1', 'S1')$$);

\echo '-- the partial unique index allows re-booking after a cancellation'
SELECT 'cancel A1', rows_changed($$UPDATE booking SET status = 'CANCELLED' WHERE seat_id = 'A1' AND status = 'CONFIRMED'$$);
SELECT 'book A1 again for U2', try_sql($$INSERT INTO booking (seat_id, user_id, status) VALUES ('A1', 'U2', 'CONFIRMED')$$);
SELECT 'A1 history rows', count(*) FROM booking WHERE seat_id = 'A1';
SELECT 'A1 active rows', count(*) FROM booking WHERE seat_id = 'A1' AND status IN ('HELD', 'CONFIRMED');

\echo '-- the seat row cannot be deleted while bookings reference it'
SELECT 'delete seat A1', try_sql($$DELETE FROM seat WHERE id = 'A1'$$);

\echo '-- expand/contract migration: add a nullable column, backfill, then enforce NOT NULL'
ALTER TABLE booking ADD COLUMN booked_at timestamptz;
SELECT 'enforce NOT NULL before backfill', try_sql($$ALTER TABLE booking ALTER COLUMN booked_at SET NOT NULL$$);
UPDATE booking SET booked_at = created_at WHERE booked_at IS NULL;
SELECT 'enforce NOT NULL after backfill', try_sql($$ALTER TABLE booking ALTER COLUMN booked_at SET NOT NULL$$);
