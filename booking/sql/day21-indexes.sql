-- Day 21 · SQL indexes and query plans. 50,000 bookings, then EXPLAIN before and after an index.
CREATE FUNCTION top_plan(q text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE p json; BEGIN EXECUTE 'EXPLAIN (FORMAT JSON) ' || q INTO p; RETURN p -> 0 -> 'Plan' ->> 'Node Type'; END $$;
CREATE FUNCTION plan_text(q text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE p json; BEGIN EXECUTE 'EXPLAIN (FORMAT JSON) ' || q INTO p; RETURN p::text; END $$;

INSERT INTO seat (id, show_id) SELECT 'Z' || g, 'S' || g FROM generate_series(1, 99) g;
INSERT INTO booking (seat_id, user_id, status)
  SELECT 'Z' || (1 + g % 99), 'U' || g, 'CANCELLED' FROM generate_series(1, 50000) g;
ANALYZE booking;

\echo '-- a lookup by user without an index reads the whole table'
SELECT 'plan for user_id = U4242 (no index)', top_plan($$SELECT * FROM booking WHERE user_id = 'U4242'$$);
CREATE INDEX booking_user_idx ON booking (user_id);
ANALYZE booking;
SELECT 'plan for user_id = U4242 (with index)', top_plan($$SELECT * FROM booking WHERE user_id = 'U4242'$$);
SELECT 'plan uses booking_user_idx', plan_text($$SELECT * FROM booking WHERE user_id = 'U4242'$$) LIKE '%booking_user_idx%';
SELECT 'rows found', count(*) FROM booking WHERE user_id = 'U4242';

\echo '-- a composite index serves its leftmost column, not the second column alone'
CREATE INDEX booking_seat_status_idx ON booking (seat_id, status);
ANALYZE booking;
SELECT 'seat_id = Z7 AND status = CANCELLED uses composite', plan_text($$SELECT id FROM booking WHERE seat_id = 'Z7' AND status = 'CANCELLED'$$) LIKE '%booking_seat_status_idx%';
SELECT 'status = HELD alone uses composite', plan_text($$SELECT id FROM booking WHERE status = 'HELD'$$) LIKE '%booking_seat_status_idx%';
SELECT 'wrapping the column in lower() uses booking_user_idx', plan_text($$SELECT * FROM booking WHERE lower(user_id) = 'u4242'$$) LIKE '%booking_user_idx%';
