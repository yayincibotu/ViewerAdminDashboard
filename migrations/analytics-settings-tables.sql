-- ANALYTICS AND SYSTEM SETTINGS TABLES

-- User Analytics Table
CREATE TABLE IF NOT EXISTS "user_analytics" (
  "id" serial PRIMARY KEY NOT NULL,
  "date" timestamp NOT NULL,
  "new_users" integer DEFAULT 0 NOT NULL,
  "active_users" integer DEFAULT 0 NOT NULL,
  "total_users" integer DEFAULT 0 NOT NULL,
  "country_data" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Subscription Analytics Table
CREATE TABLE IF NOT EXISTS "subscription_analytics" (
  "id" serial PRIMARY KEY NOT NULL,
  "date" timestamp NOT NULL,
  "plan_id" integer,
  "new_subscriptions" integer DEFAULT 0 NOT NULL,
  "cancelled_subscriptions" integer DEFAULT 0 NOT NULL,
  "total_active_subscriptions" integer DEFAULT 0 NOT NULL,
  "renewal_rate" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Financial Analytics Table
CREATE TABLE IF NOT EXISTS "financial_analytics" (
  "id" serial PRIMARY KEY NOT NULL,
  "date" timestamp NOT NULL,
  "total_revenue" integer DEFAULT 0 NOT NULL,
  "new_revenue" integer DEFAULT 0 NOT NULL,
  "recurring_revenue" integer DEFAULT 0 NOT NULL,
  "refunds" integer DEFAULT 0 NOT NULL,
  "average_revenue_per_user" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS "performance_metrics" (
  "id" serial PRIMARY KEY NOT NULL,
  "date" timestamp NOT NULL,
  "service_type" text NOT NULL,
  "total_requests" integer DEFAULT 0 NOT NULL,
  "successful_requests" integer DEFAULT 0 NOT NULL,
  "failed_requests" integer DEFAULT 0 NOT NULL,
  "average_response_time" integer DEFAULT 0,
  "resource_usage" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer,
  "action" text NOT NULL,
  "entity_type" text,
  "entity_id" text,
  "details" text,
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- System Configs Table
CREATE TABLE IF NOT EXISTS "system_configs" (
  "id" serial PRIMARY KEY NOT NULL,
  "key" text NOT NULL,
  "value" text,
  "description" text,
  "category" text NOT NULL,
  "is_encrypted" boolean DEFAULT false,
  "last_updated_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "system_configs_key_unique" UNIQUE("key")
);

-- Email Templates Table
CREATE TABLE IF NOT EXISTS "email_templates" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "type" text NOT NULL,
  "subject" text NOT NULL,
  "html_content" text NOT NULL,
  "text_content" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "last_updated_by" integer,
  "variables" text[],
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- IP Restrictions Table
CREATE TABLE IF NOT EXISTS "ip_restrictions" (
  "id" serial PRIMARY KEY NOT NULL,
  "ip_address" text NOT NULL,
  "type" text DEFAULT 'deny' NOT NULL,
  "comment" text,
  "created_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Foreign Keys
ALTER TABLE "audit_logs" 
  ADD CONSTRAINT IF NOT EXISTS "audit_logs_user_id_users_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") 
  ON DELETE no action ON UPDATE no action;

ALTER TABLE "subscription_analytics" 
  ADD CONSTRAINT IF NOT EXISTS "subscription_analytics_plan_id_subscription_plans_id_fk" 
  FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") 
  ON DELETE no action ON UPDATE no action;

ALTER TABLE "system_configs" 
  ADD CONSTRAINT IF NOT EXISTS "system_configs_last_updated_by_users_id_fk" 
  FOREIGN KEY ("last_updated_by") REFERENCES "users"("id") 
  ON DELETE no action ON UPDATE no action;

ALTER TABLE "email_templates" 
  ADD CONSTRAINT IF NOT EXISTS "email_templates_last_updated_by_users_id_fk"
  FOREIGN KEY ("last_updated_by") REFERENCES "users"("id") 
  ON DELETE no action ON UPDATE no action;

ALTER TABLE "ip_restrictions" 
  ADD CONSTRAINT IF NOT EXISTS "ip_restrictions_created_by_users_id_fk" 
  FOREIGN KEY ("created_by") REFERENCES "users"("id") 
  ON DELETE no action ON UPDATE no action;