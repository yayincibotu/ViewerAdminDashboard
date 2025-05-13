-- Add new price columns to subscription_plans table
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS daily_price INTEGER,
ADD COLUMN IF NOT EXISTS weekly_price INTEGER,
ADD COLUMN IF NOT EXISTS stripe_daily_price_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_weekly_price_id TEXT;

-- Update billing_cycle column to support new values
COMMENT ON COLUMN subscription_plans.billing_cycle IS 'Possible values: daily, weekly, monthly, annual';

-- Add new columns to user_subscriptions table
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS current_price INTEGER,
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS stripe_current_price_id TEXT;

-- Update existing subscriptions to use current price
UPDATE user_subscriptions us
SET current_price = (
    SELECT price 
    FROM subscription_plans sp 
    WHERE sp.id = us.plan_id
)
WHERE current_price IS NULL;

-- Make current_price column NOT NULL after updating existing records
ALTER TABLE user_subscriptions 
ALTER COLUMN current_price SET NOT NULL;