ALTER TABLE public_home_settings ADD COLUMN ticker_speed_seconds INTEGER NOT NULL DEFAULT 23;
ALTER TABLE public_home_settings ADD COLUMN ticker_gap_seconds INTEGER NOT NULL DEFAULT 2;
