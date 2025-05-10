-- Update payments table with new columns
ALTER TABLE payments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type TEXT NOT NULL DEFAULT 'one_time';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_id INTEGER;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS subscription_id INTEGER;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS crypto_transaction_hash TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS crypto_address TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS crypto_currency TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  invoice_number TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  issued_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  paid_date TIMESTAMP WITH TIME ZONE,
  billing_name TEXT,
  billing_email TEXT,
  billing_address TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_country TEXT,
  billing_postal_code TEXT,
  tax_amount INTEGER DEFAULT 0,
  tax_rate INTEGER DEFAULT 0,
  notes TEXT,
  terms_and_conditions TEXT,
  stripe_invoice_id TEXT,
  items TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  card_brand TEXT,
  card_last4 TEXT,
  card_expiry_month TEXT,
  card_expiry_year TEXT,
  bank_name TEXT,
  bank_last4 TEXT,
  crypto_address TEXT,
  crypto_currency TEXT,
  stripe_payment_method_id TEXT,
  billing_details TEXT,
  metadata TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE payments ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE payments ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoices(id);
ALTER TABLE payments ADD CONSTRAINT payments_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id);

ALTER TABLE invoices ADD CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE payment_methods ADD CONSTRAINT payment_methods_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);