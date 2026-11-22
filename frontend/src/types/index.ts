// Enums
export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  TECHNICIAN = 'TECHNICIAN',
  ADMIN = 'ADMIN',
}

export enum IncidentStatus {
  NEW = 'NEW',
  CLASSIFIED = 'CLASSIFIED',
  ASSIGNED = 'ASSIGNED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  VERIFIED = 'VERIFIED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum Priority {
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
  P4 = 'P4',
  P1_CRITICAL = 'P1',
  P2_HIGH = 'P2',
  P3_MEDIUM = 'P3',
  P4_LOW = 'P4',
}

export enum Category {
  HARDWARE = 'HARDWARE',
  SOFTWARE = 'SOFTWARE',
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  CLOUD = 'CLOUD',
  SECURITY = 'SECURITY',
  AUTHENTICATION = 'AUTHENTICATION',
  APPLICATION = 'APPLICATION',
  STORAGE = 'STORAGE',
}

export enum Impact {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum Urgency {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

// Base user
export interface User {
  id: string;
  email: string;
  name: string;
  full_name?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  skills?: string[];
  availability?: boolean;
  max_workload?: number;
  current_workload?: number;
}

export interface Employee extends User {
  department?: string;
  phone?: string;
}

export interface Technician extends User {
  skills?: string[];
  availability?: boolean;
  is_available?: boolean;
  current_workload?: number;
  max_workload?: number;
}

export interface Admin extends User {}

// IT Service
export interface ITService {
  id: string;
  name: string;
  description?: string;
  category?: string;
  is_critical: boolean;
  owner?: string;
  created_at: string;
}

// SLA Policy
export interface SLAPolicy {
  id: string;
  service_id?: string;
  priority: Priority | string;
  response_time_minutes: number;
  resolution_time_minutes: number;
}

// Audit Log
export interface AuditLog {
  id: string;
  incident_id: string;
  user_id: string;
  action: string;
  previous_state?: string;
  new_state?: string;
  description?: string;
  timestamp: string;
}

// Notification
export interface Notification {
  id: string;
  user_id: string;
  message: string;
  incident_id?: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

// Incident
export interface Incident {
  id: string;
  incident_number: string;
  title: string;
  description: string;
  category?: Category | string;
  impact: Impact | string;
  urgency: Urgency | string;
  priority?: Priority | string;
  priority_score?: number;
  status: IncidentStatus | string;
  reporter_id: string;
  reporter_name?: string;
  technician_id?: string | null;
  technician_name?: string;
  service_id?: string | null;
  service_name?: string;
  business_criticality?: string;
  affected_users_count?: number;
  resolution_notes?: string | null;
  investigation_notes?: string | null;
  feedback_rating?: number | null;
  feedback_comment?: string | null;
  is_duplicate?: boolean;
  duplicate_of_id?: string | null;
  sla_response_deadline?: string | null;
  sla_resolution_deadline?: string | null;
  sla_violated?: boolean;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  closed_at?: string | null;
}

// API Requests & Responses
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface CreateIncidentRequest {
  title: string;
  description: string;
  category?: Category | string;
  impact?: Impact | string;
  urgency?: Urgency | string;
  business_criticality?: string;
  affected_users_count?: number;
  service_id?: string;
}

export interface AssignRequest {
  technician_id: string;
  strategy?: string;
}

export interface ResolveRequest {
  resolution_notes: string;
}

export interface FeedbackRequest {
  feedback_rating: number;
  feedback_comment?: string;
}

export interface OverviewReport {
  total_incidents: number;
  open_incidents: number;
  critical_incidents: number;
  resolved_incidents: number;
  sla_violations: number;
}

export interface TechnicianWorkload {
  technician_id: string;
  technician_name: string;
  email: string;
  active_incidents: number;
  max_workload: number;
  utilization_percent: number;
}

export interface ServiceAnalysis {
  service_id: string;
  service_name: string;
  is_critical: boolean;
  incident_count: number;
}

export type PriorityDist = Record<string, number>;
export type CategoryDist = Record<string, number>;

export interface SLACompliance {
  resolved_total: number;
  resolved_compliant: number;
  resolved_breached: number;
  compliance_rate_percent: number;
}

export interface TrendData {
  date: string;
  count: number;
}

export interface IncidentFilters {
  status?: string;
  priority?: string;
  category?: string;
  service_id?: string;
  technician_id?: string;
  sla_violated?: boolean;
  search?: string;
  date_from?: string;
  date_to?: string;
  my_only?: boolean;
}
