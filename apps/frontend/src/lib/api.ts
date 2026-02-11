'use client';

import axios from 'axios';
import { DEFAULT_LOCALE, isValidLocale } from '@interview-library/shared/i18n';
import type {
  Topic,
  Question,
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
  updateStatus: (id: string, status: string) =>
    api.patch(`/questions/${id}/status`, { status }).then((res) => res.data),
  toggleFavorite: (id: string) =>
    api.patch<{ isFavorite: boolean }>(`/questions/${id}/favorite`).then((res) => res.data),
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
  getHistory: (limit = 20) =>
    api.get<PracticeLogEntry[]>('/practice/history', { params: { limit } }).then((res) => res.data),
};

// Auth
export const authApi = {
  getProfile: () => api.get('/auth/me').then((res) => res.data),
  logout: () => api.post('/auth/logout').then((res) => res.data),
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
