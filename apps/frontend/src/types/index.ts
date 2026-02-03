export enum QuestionLevel {
  JUNIOR = 'junior',
  MIDDLE = 'middle',
  SENIOR = 'senior',
}

export enum QuestionStatus {
  NEW = 'new',
  LEARNING = 'learning',
  MASTERED = 'mastered',
}

export enum SelfRating {
  POOR = 'poor',
  FAIR = 'fair',
  GOOD = 'good',
  GREAT = 'great',
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
  color?: string;
  icon?: string;
  description?: string;
  questionsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  title: string;
  content: string;
  answer?: string;
  topicId: string;
  topic?: Topic;
  level: QuestionLevel;
  status: QuestionStatus;
  isFavorite: boolean;
  difficultyScore: number;
  practiceCount: number;
  lastPracticedAt?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTopicDto {
  name: string;
  slug?: string;
  color?: string;
  icon?: string;
  description?: string;
}

export interface UpdateTopicDto extends Partial<CreateTopicDto> {}

export interface CreateQuestionDto {
  title: string;
  content: string;
  answer?: string;
  topicId: string;
  level?: QuestionLevel;
  status?: QuestionStatus;
  isFavorite?: boolean;
  difficultyScore?: number;
  order?: number;
}

export interface UpdateQuestionDto extends Partial<CreateQuestionDto> {}

export interface QueryQuestionsDto {
  topicId?: string;
  level?: QuestionLevel;
  status?: QuestionStatus;
  favorite?: boolean;
  search?: string;
}

export interface PracticeLog {
  id: string;
  questionId: string;
  question?: Question;
  selfRating: SelfRating;
  timeSpentSeconds?: number;
  notes?: string;
  practicedAt: string;
}

export interface CreatePracticeLogDto {
  questionId: string;
  selfRating: SelfRating;
  timeSpentSeconds?: number;
  notes?: string;
}

export interface PracticeStats {
  totalQuestions: number;
  totalPracticeSessions: number;
  totalPracticeTimeSeconds: number | string;
  totalPracticeTimeMinutes: number;
  questionsByStatus: Record<string, number>;
  questionsByLevel: Record<string, number>;
  practiceByRating: Record<string, number>;
  questionsNeedingReview: number;
  recentLogs: PracticeLogEntry[];
}

export interface PracticeLogEntry {
  id: string;
  questionId: string;
  questionTitle: string;
  topicName?: string;
  topicColor?: string;
  level: QuestionLevel;
  rating: SelfRating;
  timeSpentSeconds?: number;
  notes?: string;
  practicedAt: string;
}

export interface DueStatus {
  isDue: boolean;
  text: string;
  daysUntil?: number;
}

export interface DueQuestion extends Question {
  nextReviewAt?: string | null;
  dueStatus: DueStatus;
}
