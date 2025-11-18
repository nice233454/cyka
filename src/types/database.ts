export type UserRole = 'manager' | 'lead' | 'admin';
export type UserStatus = 'active' | 'blocked';
export type CompanyStatus = 'active' | 'inactive';
export type CallStatus = 'pending_upload' | 'uploaded' | 'transcribing' | 'transcribed' | 'analyzing' | 'done' | 'error';
export type ChecklistValue = 'yes' | 'partial' | 'no';
export type PromptType = 'summary' | 'recommendations' | 'checklist';
export type LogStatus = 'ok' | 'error';

export interface Company {
  id: string;
  name: string;
  description?: string;
  active_checklist_id?: string;
  status: CompanyStatus;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  company_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  company_id: string;
  team_id?: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Checklist {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistCategory {
  id: string;
  checklist_id: string;
  name: string;
  position: number;
}

export interface ChecklistItem {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  position: number;
  is_active: boolean;
}

export interface LLMPrompt {
  id: string;
  type: PromptType;
  name: string;
  model: string;
  prompt_text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IntegrationSettings {
  id: string;
  assemblyai_api_key?: string;
  assemblyai_webhook_secret?: string;
  llm_provider: string;
  llm_api_key?: string;
  llm_base_url?: string;
  llm_default_model?: string;
}

export interface ProcessingLog {
  id: string;
  call_id?: string;
  company_id?: string;
  user_id?: string;
  stage: string;
  status: LogStatus;
  message?: string;
  created_at: string;
}
