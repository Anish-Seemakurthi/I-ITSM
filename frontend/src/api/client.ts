import axios from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  Incident,
  CreateIncidentRequest,
  AssignRequest,
  ResolveRequest,
  FeedbackRequest,
  AuditLog,
  Notification,
  ITService,
  SLAPolicy,
  Technician,
  OverviewReport,
  TechnicianWorkload,
  PriorityDist,
  CategoryDist,
  TrendData,
  SLACompliance,
  ServiceAnalysis,
  IncidentFilters,
} from '../types';

const API_BASE = 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('itsm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('itsm_token');
      localStorage.removeItem('itsm_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    apiClient.post<User>('/auth/register', data).then((r) => r.data),

  getMe: () => apiClient.get<User>('/auth/me').then((r) => r.data),
};

// ─── Incidents ───────────────────────────────────────────────────────────────
export const incidentsApi = {
  getAll: (filters?: IncidentFilters) =>
    apiClient.get<Incident[]>('/incidents/', { params: filters }).then((r) => r.data),

  getOne: (id: string) =>
    apiClient.get<Incident>(`/incidents/${id}`).then((r) => r.data),

  create: (data: CreateIncidentRequest) =>
    apiClient.post<Incident>('/incidents/', data).then((r) => r.data),

  classify: (id: string, category: string, notes?: string) =>
    apiClient.put<Incident>(`/incidents/${id}/classify`, { category, investigation_notes: notes }).then((r) => r.data),

  assign: (id: string, data: AssignRequest) =>
    apiClient.put<Incident>(`/incidents/${id}/assign`, data).then((r) => r.data),

  acknowledge: (id: string) =>
    apiClient.put<Incident>(`/incidents/${id}/acknowledge`).then((r) => r.data),

  startInvestigation: (id: string) =>
    apiClient.put<Incident>(`/incidents/${id}/start_investigation`).then((r) => r.data),

  resolve: (id: string, data: ResolveRequest) =>
    apiClient.put<Incident>(`/incidents/${id}/resolve`, data).then((r) => r.data),

  verify: (id: string) =>
    apiClient.put<Incident>(`/incidents/${id}/verify`).then((r) => r.data),

  close: (id: string) =>
    apiClient.put<Incident>(`/incidents/${id}/close`).then((r) => r.data),

  addFeedback: (id: string, data: FeedbackRequest) =>
    apiClient.put<Incident>(`/incidents/${id}/feedback`, data).then((r) => r.data),

  getAudit: (id: string) =>
    apiClient.get<AuditLog[]>(`/incidents/${id}/audit`).then((r) => r.data),

  getSimilar: (id: string) =>
    apiClient.get<any[]>(`/incidents/${id}/similar`).then((r) => r.data),

  recommendTechnicians: (id: string) =>
    apiClient.get<any[]>(`/incidents/${id}/recommend_technicians`).then((r) => r.data),

  suggestCategory: (title: string, description: string) =>
    apiClient.post<any>('/incidents/suggest_category', { title, description }).then((r) => r.data),

  checkDuplicate: (payload: { title: string; description: string; category?: string; service_id?: string }) =>
    apiClient.post<any[]>('/incidents/check_duplicate', payload).then((r) => r.data),
};

// ─── Technicians ─────────────────────────────────────────────────────────────
export const techniciansApi = {
  getAll: () =>
    apiClient.get<Technician[]>('/technicians/').then((r) => r.data),

  create: (data: Partial<Technician> & { password?: string }) =>
    apiClient.post<Technician>('/technicians/', data).then((r) => r.data),

  update: (id: string, data: Partial<Technician>) =>
    apiClient.put<Technician>(`/technicians/${id}`, data).then((r) => r.data),

  getWorkload: (id: string) =>
    apiClient.get<Incident[]>(`/technicians/${id}/workload`).then((r) => r.data),

  getAvailable: (category?: string) =>
    apiClient.get<Technician[]>('/technicians/available/filter', { params: { category } }).then((r) => r.data),
};

// ─── IT Services ─────────────────────────────────────────────────────────────
export const servicesApi = {
  getAll: () =>
    apiClient.get<ITService[]>('/services/').then((r) => r.data),

  create: (data: Partial<ITService>) =>
    apiClient.post<ITService>('/services/', data).then((r) => r.data),

  update: (id: string, data: Partial<ITService>) =>
    apiClient.put<ITService>(`/services/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/services/${id}`).then((r) => r.data),
};

// ─── SLA ─────────────────────────────────────────────────────────────────────
export const slaApi = {
  getPolicies: () =>
    apiClient.get<SLAPolicy[]>('/sla/policies').then((r) => r.data),

  createPolicy: (data: Partial<SLAPolicy>) =>
    apiClient.post<SLAPolicy>('/sla/policies', data).then((r) => r.data),

  updatePolicy: (id: string, data: Partial<SLAPolicy>) =>
    apiClient.put<SLAPolicy>(`/sla/policies/${id}`, data).then((r) => r.data),

  getViolations: () =>
    apiClient.get<Incident[]>('/sla/violations').then((r) => r.data),

  getAtRisk: () =>
    apiClient.get<Incident[]>('/sla/at_risk').then((r) => r.data),

  triggerCheck: () =>
    apiClient.post('/sla/check').then((r) => r.data),
};

// ─── Reports ─────────────────────────────────────────────────────────────────
export const reportsApi = {
  getOverview: () =>
    apiClient.get<OverviewReport>('/reports/overview').then((r) => r.data),

  getTechnicianWorkload: () =>
    apiClient.get<TechnicianWorkload[]>('/reports/technician_workload').then((r) => r.data),

  getServiceAnalysis: () =>
    apiClient.get<ServiceAnalysis[]>('/reports/service_analysis').then((r) => r.data),

  getPriorityDist: () =>
    apiClient.get<PriorityDist>('/reports/priority_distribution').then((r) => r.data),

  getCategoryDist: () =>
    apiClient.get<CategoryDist>('/reports/category_distribution').then((r) => r.data),

  getSLACompliance: () =>
    apiClient.get<SLACompliance>('/reports/sla_compliance').then((r) => r.data),

  getTrends: (days = 7) =>
    apiClient.get<TrendData[]>('/reports/trends', { params: { days } }).then((r) => r.data),
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminApi = {
  getUsers: (role?: string) =>
    apiClient.get<User[]>('/admin/users', { params: { role } }).then((r) => r.data),

  updateUserStatus: (id: string, data: { is_active?: boolean; role?: string }) =>
    apiClient.put<User>(`/admin/users/${id}/status`, data).then((r) => r.data),

  getAuditLogs: (params?: { incident_id?: string; user_id?: string; action?: string; limit?: number }) =>
    apiClient.get<AuditLog[]>('/admin/audit_logs', { params }).then((r) => r.data),

  getNotifications: () =>
    apiClient.get<Notification[]>('/admin/notifications').then((r) => r.data),

  markNotificationRead: (id: string) =>
    apiClient.put(`/admin/notifications/${id}/read`).then((r) => r.data),
};

export default apiClient;
