-- Create Login Attempts table
CREATE TABLE IF NOT EXISTS login_attempts (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT FALSE,
  failure_reason TEXT,
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create Two Factor Authentication table
CREATE TABLE IF NOT EXISTS two_factor_auth (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) UNIQUE,
  secret TEXT NOT NULL,
  backup_codes TEXT,
  enabled BOOLEAN DEFAULT FALSE,
  last_verified TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create Security Questions table
CREATE TABLE IF NOT EXISTS security_questions (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create User Security Questions table
CREATE TABLE IF NOT EXISTS user_security_questions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  question_id INTEGER NOT NULL REFERENCES security_questions(id),
  answer_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create Security Sessions table
CREATE TABLE IF NOT EXISTS security_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  session_token TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  last_active TIMESTAMP DEFAULT NOW() NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create default security system configuration values
INSERT INTO system_configs (key, value, description, category, created_at, updated_at)
VALUES 
  ('security_password_min_length', '8', 'Minimum password length', 'security', NOW(), NOW()),
  ('security_password_require_uppercase', 'true', 'Require uppercase letters in passwords', 'security', NOW(), NOW()),
  ('security_password_require_lowercase', 'true', 'Require lowercase letters in passwords', 'security', NOW(), NOW()),
  ('security_password_require_numbers', 'true', 'Require numbers in passwords', 'security', NOW(), NOW()),
  ('security_password_require_special', 'true', 'Require special characters in passwords', 'security', NOW(), NOW()),
  ('security_account_lockout_attempts', '5', 'Number of failed login attempts before account lockout', 'security', NOW(), NOW()),
  ('security_account_lockout_duration', '30', 'Account lockout duration in minutes', 'security', NOW(), NOW()),
  ('security_session_timeout', '60', 'Session timeout in minutes', 'security', NOW(), NOW()),
  ('security_enable_2fa', 'false', 'Enable two-factor authentication', 'security', NOW(), NOW()),
  ('security_2fa_mandatory', 'false', 'Make two-factor authentication mandatory for all users', 'security', NOW(), NOW()),
  ('security_monitor_suspicious_activity', 'true', 'Monitor and log suspicious login activity', 'security', NOW(), NOW()),
  ('security_ip_rate_limit', '100', 'Maximum number of requests per hour from same IP', 'security', NOW(), NOW()),
  ('security_api_rate_limit', '200', 'Maximum number of API requests per hour from same user', 'security', NOW(), NOW())
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, 
    description = EXCLUDED.description, 
    updated_at = NOW();

-- Create default security questions
INSERT INTO security_questions (question, is_active, created_at)
VALUES 
  ('What was the name of your first pet?', TRUE, NOW()),
  ('In what city were you born?', TRUE, NOW()),
  ('What is your mother''s maiden name?', TRUE, NOW()),
  ('What high school did you attend?', TRUE, NOW()),
  ('What was the make of your first car?', TRUE, NOW()),
  ('What is your favorite movie?', TRUE, NOW()),
  ('What was your childhood nickname?', TRUE, NOW()),
  ('What is the name of your favorite childhood teacher?', TRUE, NOW()),
  ('What is your favorite sports team?', TRUE, NOW()),
  ('What was the street name you lived on as a child?', TRUE, NOW())
ON CONFLICT (question) DO NOTHING;