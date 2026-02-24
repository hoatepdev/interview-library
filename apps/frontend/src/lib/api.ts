'use client';

import axios from 'axios';
import { DEFAULT_LOCALE, isValidLocale } from '@interview-library/shared/i18n';
import type {
  Topic,
  Question,
  QuestionRevision,
  CreateTopicDto,
  UpdateTopicDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  QueryQuestionsDto,
  PracticeLog,
  CreatePracticeLogDto,
  PracticeStats,
  PracticeLogEntry,
  DueQuestion,
  AnalyticsResponse,
  ImportResult,
} from '@/types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies for authentication
});

// Request interceptor to add Accept-Language header
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const storedLocale = sessionStorage.getItem('i18n_locale');
    const pathLocale = window.location.pathname.split('/')[1];
    const locale = storedLocale || (isValidLocale(pathLocale) ? pathLocale : DEFAULT_LOCALE);
    config.headers['Accept-Language'] = locale;
  }
  return config;
});

// Topics
export const topicsApi = {
  getAll: () => api.get<Topic[]>('/topics').then((res) => res.data),
  getById: (id: string) => api.get<Topic>(`/topics/${id}`).then((res) => res.data),
  getBySlug: (slug: string) => api.get<Topic>(`/topics/slug/${slug}`).then((res) => res.data),
  create: (data: CreateTopicDto) => api.post<Topic>('/topics', data).then((res) => res.data),
  update: (id: string, data: UpdateTopicDto) => api.put<Topic>(`/topics/${id}`, data).then((res) => res.data),
  delete: (id: string) => api.delete(`/topics/${id}`).then((res) => res.data),
};

// Questions
export const questionsApi = {
  getAll: (params?: QueryQuestionsDto) =>
    api.get<Question[]>('/questions', { params }).then((res) => res.data),
  getById: (id: string) => api.get<Question>(`/questions/${id}`).then((res) => res.data),
  getByTopicSlug: (slug: string, params?: QueryQuestionsDto) =>
    api.get<Question[]>(`/questions/by-topic-slug/${slug}`, { params }).then((res) => res.data),
  create: (data: CreateQuestionDto) => api.post<Question>('/questions', data).then((res) => res.data),
  update: (id: string, data: UpdateQuestionDto) => api.put<Question>(`/questions/${id}`, data).then((res) => res.data),
  delete: (id: string) => api.delete(`/questions/${id}`).then((res) => res.data),
  toggleFavorite: (id: string) =>
    api.patch<{ isFavorite: boolean }>(`/questions/${id}/favorite`).then((res) => res.data),
  exportQuestions: (params: { format: 'json' | 'csv'; topicId?: string; level?: string }) => {
    return api.get('/questions/export', {
      params,
      responseType: 'blob',
    }).then((res) => {
      const contentDisposition = res.headers['content-disposition'];
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `questions-export.${params.format}`;
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
  },
  importQuestions: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ImportResult>('/questions/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((res) => res.data);
  },
};

// Practice
export const practiceApi = {
  getRandomQuestion: (params?: { topicId?: string; level?: string; status?: string; excludeQuestionId?: string }) =>
    api.get<Question>('/practice/random', { params }).then((res) => res.data),
  getNextQuestion: (params?: { topicId?: string; level?: string; status?: string; excludeQuestionId?: string }) =>
    api.get<Question & { isPrioritized: boolean }>('/practice/next', { params }).then((res) => res.data),
  getQuestionsDueForReview: (limit = 20) =>
    api.get<DueQuestion[]>('/practice/due', { params: { limit } }).then((res) => res.data),
  getDueQuestionsCount: () =>
    api.get<{ count: number }>('/practice/due-count').then((res) => res.data),
  logPractice: (data: CreatePracticeLogDto) =>
    api.post<PracticeLog>('/practice/log', data).then((res) => res.data),
  getStats: () => api.get<PracticeStats>('/practice/stats').then((res) => res.data),
  getAnalytics: (days = 30) =>
    api.get<AnalyticsResponse>('/practice/analytics', { params: { days } }).then((res) => res.data),
  getHistory: (limit = 20) =>
    api.get<PracticeLogEntry[]>('/practice/history', { params: { limit } }).then((res) => res.data),
};

// Auth
export const authApi = {
  getProfile: () => api.get('/auth/me').then((res) => res.data),
  logout: () => api.post('/auth/logout').then((res) => res.data),
};

// Review (MOD/ADMIN)
export const reviewApi = {
  getPending: () =>
    api.get<{ questions: Question[]; revisions: QuestionRevision[] }>('/review/pending').then((res) => res.data),
  getPendingCount: () =>
    api.get<{ count: number }>('/review/pending/count').then((res) => res.data),
  getRevision: (id: string) =>
    api.get<QuestionRevision>(`/review/revisions/${id}`).then((res) => res.data),
  getHistory: (limit = 50) =>
    api.get('/review/history', { params: { limit } }).then((res) => res.data),
  approveQuestion: (id: string, note?: string) =>
    api.post<Question>(`/review/questions/${id}/approve`, { note }).then((res) => res.data),
  rejectQuestion: (id: string, note: string) =>
    api.post<Question>(`/review/questions/${id}/reject`, { note }).then((res) => res.data),
  approveRevision: (id: string, note?: string) =>
    api.post<Question>(`/review/revisions/${id}/approve`, { note }).then((res) => res.data),
  rejectRevision: (id: string, note: string) =>
    api.post<QuestionRevision>(`/review/revisions/${id}/reject`, { note }).then((res) => res.data),
};

// Admin (ADMIN only)
export const adminApi = {
  getUsers: () => api.get('/admin/users').then((res) => res.data),
  updateUserRole: (userId: string, role: string) =>
    api.patch(`/admin/users/${userId}/role`, { role }).then((res) => res.data),
};

// Convenience functions for backward compatibility
export async function getTopics(): Promise<Topic[]> {
  return topicsApi.getAll();
}

export async function getQuestions(params?: QueryQuestionsDto): Promise<Question[]> {
  return questionsApi.getAll(params);
}

export async function getRandomQuestion(params?: {
  topicId?: string;
  level?: string;
  status?: string;
  excludeQuestionId?: string;
}): Promise<Question> {
  return practiceApi.getRandomQuestion(params);
}

// Re-export types
export type { Topic, Question, CreateTopicDto, CreateQuestionDto, PracticeStats };

export default api;
