/*
  # Create core database schema for Salvio MVP Admin Panel

  1. New Tables
    - `companies` - Organizations table
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text, nullable)
      - `active_checklist_id` (uuid, nullable FK)
      - `status` (enum: active, inactive)
      - `created_at`, `updated_at` (timestamps)
    
    - `teams` - Teams within companies
      - `id` (uuid, primary key)
      - `company_id` (uuid, FK to companies)
      - `name` (text, not null)
      - `created_at`, `updated_at` (timestamps)
    
    - `users` - User accounts for mobile and web client
      - `id` (uuid, primary key)
      - `company_id` (uuid, FK to companies)
      - `team_id` (uuid, nullable FK to teams)
      - `email` (text, unique, not null)
      - `password_hash` (text, not null)
      - `full_name` (text, not null)
      - `role` (enum: manager, lead, admin)
      - `status` (enum: active, blocked)
      - `created_at`, `updated_at` (timestamps)
    
    - `checklists` - Checklist templates
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text, nullable)
      - `created_at`, `updated_at` (timestamps)
    
    - `checklist_categories` - Categories within checklists
      - `id` (uuid, primary key)
      - `checklist_id` (uuid, FK to checklists, cascade delete)
      - `name` (text, not null)
      - `position` (int, default 0)
    
    - `checklist_items` - Individual criteria within categories
      - `id` (uuid, primary key)
      - `category_id` (uuid, FK to checklist_categories, cascade delete)
      - `name` (text, not null)
      - `description` (text, nullable)
      - `position` (int, default 0)
      - `is_active` (boolean, default true)
    
    - `llm_prompts` - LLM prompts configuration
      - `id` (uuid, primary key)
      - `type` (enum: summary, recommendations, checklist)
      - `name` (text, not null)
      - `model` (text, not null)
      - `prompt_text` (text, not null)
      - `is_active` (boolean, default true)
      - `created_at`, `updated_at` (timestamps)
    
    - `integration_settings` - Integration configuration (single row)
      - `id` (uuid, primary key)
      - `assemblyai_api_key` (text, nullable)
      - `assemblyai_webhook_secret` (text, nullable)
      - `llm_provider` (text, default 'openai')
      - `llm_api_key` (text, nullable)
      - `llm_base_url` (text, nullable)
      - `llm_default_model` (text, nullable)
    
    - `calls` - Call/meeting records
      - `id` (uuid, primary key)
      - `company_id` (uuid, FK to companies)
      - `user_id` (uuid, FK to users)
      - `team_id` (uuid, nullable FK to teams)
      - `title` (text, not null)
      - `started_at` (timestamp, not null)
      - `finished_at` (timestamp, nullable)
      - `duration_seconds` (int, nullable)
      - `audio_url` (text, nullable)
      - `status` (enum: pending_upload, uploaded, transcribing, transcribed, analyzing, done, error)
      - `error_message` (text, nullable)
      - `assemblyai_transcript_id` (text, nullable)
      - `score_average` (numeric(5,2), nullable)
      - `created_at`, `updated_at` (timestamps)
    
    - `call_transcripts` - Transcription results
      - `id` (uuid, primary key)
      - `call_id` (uuid, unique FK to calls)
      - `transcript_text` (text, not null)
      - `raw_json` (jsonb, nullable)
    
    - `call_analysis` - AI analysis results
      - `id` (uuid, primary key)
      - `call_id` (uuid, unique FK to calls)
      - `summary_text` (text, nullable)
      - `recommendations_text` (text, nullable)
      - `extra_tags` (jsonb, nullable)
    
    - `call_checklist_results` - Checklist evaluation results
      - `id` (uuid, primary key)
      - `call_id` (uuid, FK to calls, cascade delete)
      - `checklist_item_id` (uuid, FK to checklist_items)
      - `value` (enum: yes, partial, no)
      - `comment` (text, nullable)
      - Unique index on (call_id, checklist_item_id)
    
    - `processing_logs` - Processing event logs
      - `id` (uuid, primary key)
      - `call_id` (uuid, nullable)
      - `company_id` (uuid, nullable)
      - `user_id` (uuid, nullable)
      - `stage` (text)
      - `status` (enum: ok, error)
      - `message` (text, nullable)
      - `created_at` (timestamp, default now)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated admin users
*/

CREATE TYPE user_role AS ENUM ('manager', 'lead', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'blocked');
CREATE TYPE company_status AS ENUM ('active', 'inactive');
CREATE TYPE call_status AS ENUM ('pending_upload', 'uploaded', 'transcribing', 'transcribed', 'analyzing', 'done', 'error');
CREATE TYPE checklist_value AS ENUM ('yes', 'partial', 'no');
CREATE TYPE prompt_type AS ENUM ('summary', 'recommendations', 'checklist');
CREATE TYPE log_status AS ENUM ('ok', 'error');

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  active_checklist_id uuid,
  status company_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  role user_role NOT NULL DEFAULT 'manager',
  status user_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE companies ADD CONSTRAINT fk_active_checklist 
  FOREIGN KEY (active_checklist_id) REFERENCES checklists(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS checklist_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  name text NOT NULL,
  position int DEFAULT 0
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES checklist_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  position int DEFAULT 0,
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS llm_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type prompt_type NOT NULL,
  name text NOT NULL,
  model text NOT NULL,
  prompt_text text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integration_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assemblyai_api_key text,
  assemblyai_webhook_secret text,
  llm_provider text DEFAULT 'openai',
  llm_api_key text,
  llm_base_url text,
  llm_default_model text
);

CREATE TABLE IF NOT EXISTS calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  title text NOT NULL,
  started_at timestamptz NOT NULL,
  finished_at timestamptz,
  duration_seconds int,
  audio_url text,
  status call_status DEFAULT 'pending_upload',
  error_message text,
  assemblyai_transcript_id text,
  score_average numeric(5,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS call_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid UNIQUE NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  transcript_text text NOT NULL,
  raw_json jsonb
);

CREATE TABLE IF NOT EXISTS call_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid UNIQUE NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  summary_text text,
  recommendations_text text,
  extra_tags jsonb
);

CREATE TABLE IF NOT EXISTS call_checklist_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  checklist_item_id uuid NOT NULL REFERENCES checklist_items(id),
  value checklist_value NOT NULL,
  comment text,
  UNIQUE(call_id, checklist_item_id)
);

CREATE TABLE IF NOT EXISTS processing_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid REFERENCES calls(id) ON DELETE SET NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  stage text NOT NULL,
  status log_status NOT NULL,
  message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_checklist_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage companies"
  ON companies FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE POLICY "Admin can manage teams"
  ON teams FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE POLICY "Admin can manage users"
  ON users FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE POLICY "Admin can manage checklists"
  ON checklists FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE POLICY "Admin can manage checklist_categories"
  ON checklist_categories FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE POLICY "Admin can manage checklist_items"
  ON checklist_items FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE POLICY "Admin can manage llm_prompts"
  ON llm_prompts FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE POLICY "Admin can manage integration_settings"
  ON integration_settings FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE POLICY "Admin can view calls"
  ON calls FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE POLICY "Admin can view call_transcripts"
  ON call_transcripts FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE POLICY "Admin can view call_analysis"
  ON call_analysis FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE POLICY "Admin can view call_checklist_results"
  ON call_checklist_results FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE POLICY "Admin can view processing_logs"
  ON processing_logs FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

INSERT INTO integration_settings (id) VALUES ('00000000-0000-0000-0000-000000000001')
  ON CONFLICT (id) DO NOTHING;