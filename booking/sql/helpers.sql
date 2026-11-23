-- booking/sql/helpers.sql : test helpers for the fixtures (not part of the application schema).
-- try_sql runs one statement and returns 'ok' or '<SQLSTATE> <constraint or message>', so an expected
-- failure becomes a printable result instead of stopping the script.
CREATE FUNCTION try_sql(stmt text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE c text; m text; s text; col text;
BEGIN
  EXECUTE stmt;
  RETURN 'ok';
EXCEPTION WHEN others THEN
  GET STACKED DIAGNOSTICS s = RETURNED_SQLSTATE, c = CONSTRAINT_NAME, m = MESSAGE_TEXT, col = COLUMN_NAME;
  IF s = '23502' THEN RETURN s || ' not null: ' || coalesce(nullif(col, ''), m); END IF;  -- same text on PostgreSQL 16, 17 and 18
  RETURN s || ' ' || coalesce(nullif(c, ''), m);
END $$;

-- rows_changed runs one DML statement and returns how many rows it changed.
CREATE FUNCTION rows_changed(stmt text) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  EXECUTE stmt;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
