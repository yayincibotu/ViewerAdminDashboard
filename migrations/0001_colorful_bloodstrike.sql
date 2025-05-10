CREATE TABLE "audit_logs" (
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
--> statement-breakpoint
CREATE TABLE "blog_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text NOT NULL,
	"content" text NOT NULL,
	"coverimage" text,
	"author_id" integer NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"tags" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'unread' NOT NULL,
	"ip_address" text,
	"replied_by" integer,
	"replied_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
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
--> statement-breakpoint
CREATE TABLE "faq_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_analytics" (
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
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"invoice_number" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" text NOT NULL,
	"due_date" timestamp,
	"issued_date" timestamp DEFAULT now() NOT NULL,
	"paid_date" timestamp,
	"billing_name" text,
	"billing_email" text,
	"billing_address" text,
	"billing_city" text,
	"billing_state" text,
	"billing_country" text,
	"billing_postal_code" text,
	"tax_amount" integer DEFAULT 0,
	"tax_rate" integer DEFAULT 0,
	"notes" text,
	"terms_and_conditions" text,
	"stripe_invoice_id" text,
	"items" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ip_restrictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip_address" text NOT NULL,
	"type" text DEFAULT 'deny' NOT NULL,
	"comment" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_contents" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"last_updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "page_contents_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false,
	"card_brand" text,
	"card_last4" text,
	"card_expiry_month" text,
	"card_expiry_year" text,
	"bank_name" text,
	"bank_last4" text,
	"crypto_address" text,
	"crypto_currency" text,
	"stripe_payment_method_id" text,
	"billing_details" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_metrics" (
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
--> statement-breakpoint
CREATE TABLE "subscription_analytics" (
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
--> statement-breakpoint
CREATE TABLE "system_configs" (
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
--> statement-breakpoint
CREATE TABLE "user_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"new_users" integer DEFAULT 0 NOT NULL,
	"active_users" integer DEFAULT 0 NOT NULL,
	"total_users" integer DEFAULT 0 NOT NULL,
	"country_data" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "payment_type" text DEFAULT 'one_time' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "refund_reason" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "invoice_id" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "subscription_id" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "crypto_transaction_hash" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "crypto_address" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "crypto_currency" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "metadata" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "annual_price" integer;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "billing_cycle" text DEFAULT 'monthly';--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "stripe_product_id" text;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "stripe_annual_price_id" text;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "promo_code" text;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "discount_percentage" integer;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "is_visible" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "is_coming_soon" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "sort_order" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_data" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "security_settings" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notification_preferences" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "billing_info" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_token_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_category_id_blog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_replied_by_users_id_fk" FOREIGN KEY ("replied_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_category_id_faq_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."faq_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_restrictions" ADD CONSTRAINT "ip_restrictions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_contents" ADD CONSTRAINT "page_contents_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_analytics" ADD CONSTRAINT "subscription_analytics_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_configs" ADD CONSTRAINT "system_configs_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;