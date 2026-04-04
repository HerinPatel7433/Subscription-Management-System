-- server/prisma/migrations/add_password_reset_to_users.sql
-- Run this against your database if you initialized with 001_initial_schema.sql
-- and want to add password-reset token support without running prisma migrate dev.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_reset_token  VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password_reset_expiry TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN users.password_reset_token  IS 'SHA-256 hash of the password-reset token';
COMMENT ON COLUMN users.password_reset_expiry IS 'Expiry timestamp for the password-reset token (1-hour window)';
