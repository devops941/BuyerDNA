import { apiClient } from './client';
import {
  User, Dataset, Customer, AnalysisJob, AnalysisResult,
  DashboardOverviewData
} from '../types';

export const authApi = {
  login: (data: any) => apiClient.post<{ success: boolean; data: { user: User; token: string } }>('/auth/login', data),
  register: (data: any) => apiClient.post<{ success: boolean; data: { user: User; token: string } }>('/auth/register', data),
  getMe: () => apiClient.get<{ success: boolean; data: User }>('/auth/me'),
  updateProfile: (data: any) => apiClient.put<{ success: boolean; data: User }>('/auth/profile', data),
  changePassword: (data: any) => apiClient.post<{ success: boolean }>('/auth/change-password', data),
};

export const datasetApi = {
  getDatasets: () => apiClient.get<{ success: boolean; data: Dataset[] }>('/datasets'),
  getDatasetById: (id: string) => apiClient.get<{ success: boolean; data: Dataset }>(`/datasets/${id}`),
  uploadDataset: (formData: FormData) => apiClient.post<{ success: boolean; data: any }>('/datasets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  validateDataset: (datasetId: string, mapping: any) =>
    apiClient.post<{ success: boolean; data: Dataset }>(`/datasets/${datasetId}/validate`, { mapping }),
  deleteDataset: (id: string) => apiClient.delete<{ success: boolean }>(`/datasets/${id}`),
  getPreview: (id: string) => apiClient.get<{ success: boolean; data: any[] }>(`/datasets/${id}/preview`),
  getRejected: (id: string) => apiClient.get<{ success: boolean; data: any[] }>(`/datasets/${id}/rejected`),
};

export const analysisApi = {
  startAnalysis: (datasetId: string, algorithm?: string, parameters?: any) =>
    apiClient.post<{ success: boolean; data: AnalysisJob }>('/analysis/run', { datasetId, algorithm, parameters }),
  getJobStatus: (jobId: string) =>
    apiClient.get<{ success: boolean; data: { job: AnalysisJob; result: AnalysisResult | null } }>(`/analysis/jobs/${jobId}`),
  getLatestResult: (datasetId?: string) =>
    apiClient.get<{ success: boolean; data: AnalysisResult }>(`/analysis/results/${datasetId || 'active'}`),
  getAllJobs: (datasetId?: string) =>
    apiClient.get<{ success: boolean; data: AnalysisJob[] }>('/analysis/jobs', { params: { datasetId } }),
};

export const customerApi = {
  getCustomers: (params: any) => apiClient.get<{ success: boolean; data: Customer[]; pagination: any }>('/customers', { params }),
  getCustomerProfile: (datasetId: string, customerId: string) =>
    apiClient.get<{ success: boolean; data: { customer: Customer; transactions: any[] } }>(`/customers/${datasetId}/${customerId}`),
  getSegmentsOverview: (datasetId: string) =>
    apiClient.get<{ success: boolean; data: any[] }>('/customers/segments/overview', { params: { datasetId } }),
};

export const dashboardApi = {
  getOverview: (datasetId?: string) =>
    apiClient.get<{ success: boolean; data: DashboardOverviewData }>('/dashboard/overview', { params: { datasetId } }),
};

export const reportApi = {
  getReports: (datasetId?: string) => apiClient.get<{ success: boolean; data: any[] }>('/reports', { params: { datasetId } }),
  generateReport: (data: { datasetId: string; type: string; format: string }) =>
    apiClient.post<{ success: boolean; data: any }>('/reports/generate', data),
};

export const historyApi = {
  getAuditLogs: (page = 1, limit = 50) => apiClient.get<{ success: boolean; data: any[]; pagination: any }>('/history/audit', { params: { page, limit } }),
  compareRuns: (runId1: string, runId2: string) => apiClient.get<{ success: boolean; data: any }>('/history/compare', { params: { runId1, runId2 } }),
};

export const settingsApi = {
  getPresets: () => apiClient.get<{ success: boolean; data: any[] }>('/settings/presets'),
  savePreset: (data: any) => apiClient.post<{ success: boolean; data: any }>('/settings/presets', data),
  deletePreset: (id: string) => apiClient.delete<{ success: boolean }>(`/settings/presets/${id}`),
};
