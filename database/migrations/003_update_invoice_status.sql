-- database/migrations/003_update_invoice_status.sql
-- Drop the existing check constraint on invoices.status and recreate it to include 'cancelled'.

DO $$ 
DECLARE 
    constraint_name text;
BEGIN
    -- Find the check constraint name for invoices.status
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'invoices'::regclass 
      AND contype = 'c' 
      AND pg_get_constraintdef(oid) LIKE '%status%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE invoices DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

-- Add the new check constraint
ALTER TABLE invoices
ADD CONSTRAINT invoices_status_check CHECK (status IN ('draft', 'confirmed', 'paid', 'cancelled'));
