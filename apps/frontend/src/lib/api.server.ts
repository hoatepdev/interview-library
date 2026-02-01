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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit & { params?: Record<string, any> },
  locale?: string
): Promise<T> {
  const url = new URL(`${API_URL}${endpoint}`);

  // Add locale as query parameter for server-side calls
  if (locale) {
    url.searchParams.set('lang', locale);
  }

  // Add other query parameters
  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

// Server-side Topics API with locale support
export const topicsApiServer = {
  getAll: (locale?: string) => fetchApi<Topic[]>('/topics', {}, locale),
  getById: (id: string, locale?: string) => fetchApi<Topic>(`/topics/${id}`, {}, locale),
};

// Server-side Questions API with locale support
export const questionsApiServer = {
  getAll: (params?: QueryQuestionsDto, locale?: string) =>
    fetchApi<Question[]>('/questions', { params }, locale),
  getById: (id: string, locale?: string) =>
    fetchApi<Question>(`/questions/${id}`, {}, locale),
};

// Server-side Practice API with locale support
export const practiceApiServer = {
  getRandomQuestion: (
    params?: { topicId?: string; level?: string; status?: string; excludeQuestionId?: string },
    locale?: string
  ) => fetchApi<Question>('/practice/random', { params }, locale),
};

// Convenience function for server components
export async function getTopicsServer(locale?: string): Promise<Topic[]> {
  return topicsApiServer.getAll(locale);
}

export async function getQuestionsServer(params?: QueryQuestionsDto, locale?: string): Promise<Question[]> {
  return questionsApiServer.getAll(params, locale);
}

export async function getRandomQuestionServer(
  params?: { topicId?: string; level?: string; status?: string; excludeQuestionId?: string },
  locale?: string
): Promise<Question> {
  return practiceApiServer.getRandomQuestion(params, locale);
}
