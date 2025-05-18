-- Create review source enum type
CREATE TYPE review_source AS ENUM ('user', 'auto');

-- Create product reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES digital_products(id),
  user_id INTEGER REFERENCES users(id),
  rating INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  pros TEXT[],
  cons TEXT[],
  verified_purchase BOOLEAN NOT NULL DEFAULT false,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  report_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  source review_source NOT NULL DEFAULT 'user',
  author_info TEXT,
  platform TEXT,
  country_code TEXT,
  device_type TEXT,
  social_proof TEXT,
  metadata TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create review votes table
CREATE TABLE IF NOT EXISTS review_votes (
  id SERIAL PRIMARY KEY,
  review_id INTEGER NOT NULL REFERENCES product_reviews(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create review templates table
CREATE TABLE IF NOT EXISTS review_templates (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  platform_id INTEGER NOT NULL,
  sentence_templates TEXT[] NOT NULL,
  positive_adjectives TEXT[] NOT NULL,
  negative_adjectives TEXT[] NOT NULL,
  feature_points TEXT[] NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create review generation settings table
CREATE TABLE IF NOT EXISTS review_generation_settings (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES digital_products(id),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  min_rating INTEGER NOT NULL DEFAULT 3,
  max_rating INTEGER NOT NULL DEFAULT 5,
  review_distribution TEXT,
  target_review_count INTEGER DEFAULT 10,
  daily_generation_limit INTEGER DEFAULT 1,
  random_generation BOOLEAN DEFAULT true,
  generation_schedule TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS product_reviews_product_id_idx ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS product_reviews_user_id_idx ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS product_reviews_rating_idx ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS product_reviews_status_idx ON product_reviews(status);
CREATE INDEX IF NOT EXISTS review_votes_review_id_idx ON review_votes(review_id);
CREATE INDEX IF NOT EXISTS review_votes_user_id_idx ON review_votes(user_id);
CREATE INDEX IF NOT EXISTS review_templates_category_idx ON review_templates(category);
CREATE INDEX IF NOT EXISTS review_templates_platform_id_idx ON review_templates(platform_id);
CREATE INDEX IF NOT EXISTS review_generation_settings_product_id_idx ON review_generation_settings(product_id);