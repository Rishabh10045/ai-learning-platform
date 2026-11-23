-- booking/sql/schema.sql : the shared PostgreSQL schema for the Days 12–21 SQL fixtures.
-- Every fixture runs in a fresh database: schema.sql, then helpers.sql, then the day's scenario file.
CREATE TABLE seat (
  id        text PRIMARY KEY CHECK (id ~ '^[A-Z][0-9]{1,2}$'),
  show_id   text NOT NULL,
  owner     text,
  version   integer NOT NULL DEFAULT 0
);

CREATE TABLE booking (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seat_id     text NOT NULL REFERENCES seat(id),
  user_id     text NOT NULL CHECK (length(trim(user_id)) > 0),
  status      text NOT NULL CHECK (status IN ('HELD', 'CONFIRMED', 'CANCELLED')),
  version     integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- At most one ACTIVE booking per seat; cancelled history rows are allowed to repeat.
CREATE UNIQUE INDEX one_active_booking_per_seat ON booking (seat_id) WHERE status IN ('HELD', 'CONFIRMED');

INSERT INTO seat (id, show_id) VALUES ('A1', 'S1'), ('A2', 'S1'), ('A3', 'S1'), ('B1', 'S2');
