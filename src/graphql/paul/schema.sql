CREATE TABLE IF NOT EXISTS paul_rooms (
  id                TEXT PRIMARY KEY,
  number            TEXT NOT NULL,
  floor             INTEGER NOT NULL,
  type              TEXT NOT NULL,
  status            TEXT NOT NULL,
  assigned_to       TEXT,
  notes             TEXT,
  bed_configuration TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS paul_reservations (
  id                  TEXT PRIMARY KEY,
  room_id             TEXT NOT NULL REFERENCES paul_rooms(id),
  guest_name          TEXT NOT NULL,
  check_in            DATE NOT NULL,
  check_out           DATE NOT NULL,
  adults              INTEGER NOT NULL,
  children            INTEGER NOT NULL DEFAULT 0,
  infants             INTEGER NOT NULL DEFAULT 0,
  reservation_status  TEXT NOT NULL,
  guest_status        TEXT NOT NULL,
  is_unallocated      BOOLEAN NOT NULL DEFAULT FALSE,
  outstanding_balance DOUBLE PRECISION,
  payment_expired     BOOLEAN NOT NULL DEFAULT FALSE,
  room_display_name   TEXT,
  late_checkout       BOOLEAN NOT NULL DEFAULT FALSE,
  bed_configuration   TEXT
);

CREATE INDEX IF NOT EXISTS paul_reservations_room_idx ON paul_reservations(room_id);
CREATE INDEX IF NOT EXISTS paul_reservations_dates_idx ON paul_reservations(check_in, check_out);
