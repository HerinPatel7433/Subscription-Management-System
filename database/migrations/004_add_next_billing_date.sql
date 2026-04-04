-- database/migrations/004_add_next_billing_date.sql
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS next_billing_date DATE;
