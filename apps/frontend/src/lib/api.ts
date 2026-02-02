'use client';

import axios from 'axios';
import { useLocale } from 'next-intl';
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
} from '@/types';

let currentLocale = 'en';

export function setApiLocale(locale: string) {
  currentLocale = locale;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Accept-Language header
api.interceptors.request.use((config) => {
  config.headers['Accept-Language'] = currentLocale;
  return config;
});

// Hook for client components to sync locale
export function useApiLocale() {
  const locale = useLocale();
  setApiLocale(locale);
  return { locale };
}

// Topics
export const topicsApi = {
  getAll: () => api.get<Topic[]>('/topics').then((res) => res.data),
  getById: (id: string) => api.get<Topic>(`/topics/${id}`).then((res) => res.data),
  create: (data: CreateTopicDto) => api.post<Topic>('/topics', data).then((res) => res.data),
  update: (id: string, data: UpdateTopicDto) => api.put<Topic>(`/topics/${id}`, data).then((res) => res.data),
  delete: (id: string) => api.delete(`/topics/${id}`).then((res) => res.data),
};

// Questions
export const questionsApi = {
  getAll: (params?: QueryQuestionsDto) =>
    api.get<Question[]>('/questions', { params }).then((res) => res.data),
  getById: (id: string) => api.get<Question>(`/questions/${id}`).then((res) => res.data),
  create: (data: CreateQuestionDto) => api.post<Question>('/questions', data).then((res) => res.data),
  update: (id: string, data: UpdateQuestionDto) => api.put<Question>(`/questions/${id}`, data).then((res) => res.data),
  delete: (id: string) => api.delete(`/questions/${id}`).then((res) => res.data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/questions/${id}/status`, { status }).then((res) => res.data),
  toggleFavorite: (id: string) => api.patch(`/questions/${id}/favorite`).then((res) => res.data),
};

// Practice
export const practiceApi = {
  getRandomQuestion: (params?: { topicId?: string; level?: string; status?: string; excludeQuestionId?: string }) =>
    api.get<Question>('/practice/random', { params }).then((res) => res.data),
  getQuestionsDueForReview: (limit = 20) =>
    api.get<Question[]>('/practice/due', { params: { limit } }).then((res) => res.data),
  logPractice: (data: CreatePracticeLogDto) =>
    api.post<PracticeLog>('/practice/log', data).then((res) => res.data),
  getStats: () => api.get<PracticeStats>('/practice/stats').then((res) => res.data),
  getHistory: (limit = 20) =>
    api.get<PracticeLogEntry[]>('/practice/history', { params: { limit } }).then((res) => res.data),
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
