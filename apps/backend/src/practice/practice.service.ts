import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw, LessThanOrEqual } from 'typeorm';
import { Question, QuestionStatus } from '../database/entities/question.entity';
import { ContentStatus } from '../common/enums/content-status.enum';
import { PracticeLog, SelfRating } from '../database/entities/practice-log.entity';
import { UserQuestion } from '../database/entities/user-question.entity';
import { CreatePracticeLogDto } from './dto/create-practice-log.dto';
import { QueryPracticeDto } from './dto/query-practice.dto';
import { type Locale } from '@interview-library/shared/i18n';
import { TranslationService } from '../i18n/translation.service';
import { SpacedRepetitionService } from './spaced-repetition.service';

@Injectable()
export class PracticeService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(PracticeLog)
    private readonly practiceLogRepository: Repository<PracticeLog>,
    @InjectRepository(UserQuestion)
    private readonly userQuestionRepository: Repository<UserQuestion>,
    private readonly translationService: TranslationService,
    private readonly spacedRepetitionService: SpacedRepetitionService,
  ) {}

  async getRandomQuestion(query: QueryPracticeDto, locale: Locale = 'en'): Promise<any> {
    const { topicId, level, status, excludeQuestionId } = query;

    const where: any = {};

    if (topicId) {
      where.topicId = topicId;
    }

    if (level) {
      where.level = level;
    }

    if (status) {
      where.status = status;
    }

    // Only serve approved questions in practice mode
    where.contentStatus = ContentStatus.APPROVED;

    // Exclude a specific question (useful for getting next question)
    if (excludeQuestionId) {
      where.id = Raw((alias) => `${alias} != :excludeId`, { excludeId: excludeQuestionId });
    }

    const questions = await this.questionRepository.find({
      where,
      relations: ['topic', 'translations'],
    });

    if (questions.length === 0) {
      throw new NotFoundException('No questions found matching the criteria');
    }

    // Return a random question with translations
    const randomIndex = Math.floor(Math.random() * questions.length);
    return this.translationService.formatQuestion(questions[randomIndex], locale, true).data;
  }

  /**
   * Get next question for practice (Smart Practice mode)
   * Prioritizes due questions for authenticated users, falls back to random
   */
  async getNextQuestionForPractice(
    query: QueryPracticeDto,
    locale: Locale = 'en',
    userId?: string
  ): Promise<any> {
    const { topicId, level, status, excludeQuestionId } = query;

    // For authenticated users, try to get due questions first
    if (userId) {
      const now = new Date();

      // Build the base query for due questions
      const dueQuery = this.questionRepository
        .createQueryBuilder('question')
        .leftJoin('user_questions', 'uq', 'uq.question_id = question.id AND uq.user_id = :userId', { userId })
        .where('(uq.next_review_at IS NULL OR uq.next_review_at <= :now)', { now })
        .andWhere('question.content_status = :contentStatus', { contentStatus: ContentStatus.APPROVED })
        .leftJoinAndSelect('question.topic', 'topic')
        .leftJoinAndSelect('question.translations', 'translations');

      // Apply filters
      if (topicId) {
        dueQuery.andWhere('question.topicId = :topicId', { topicId });
      }
      if (level) {
        dueQuery.andWhere('question.level = :level', { level });
      }
      if (status) {
        dueQuery.andWhere('question.status = :status', { status });
      }
      if (excludeQuestionId) {
        dueQuery.andWhere('question.id != :excludeQuestionId', { excludeQuestionId });
      }

      // Get one due question
      const dueQuestions = await dueQuery.limit(1).getMany();

      if (dueQuestions.length > 0) {
        const question = dueQuestions[0];

        // Get user-specific SM-2 data
        const userQuestion = await this.userQuestionRepository.findOne({
          where: { userId, questionId: question.id },
        });

        const formatted = this.translationService.formatQuestion(question, locale, true).data;

        return {
          ...formatted,
          isPrioritized: true,
          nextReviewAt: userQuestion?.nextReviewAt,
          easeFactor: userQuestion?.easeFactor ?? 2.5,
          intervalDays: userQuestion?.intervalDays ?? 0,
          repetitions: userQuestion?.repetitions ?? 0,
        };
      }
    }

    // No due questions or not authenticated - fall back to random
    return {
      ...(await this.getRandomQuestion(query, locale)),
      isPrioritized: false,
    };
  }

  /**
   * Get count of due questions for a user
   */
  async getDueQuestionsCount(userId?: string): Promise<number> {
    if (!userId) {
      return 0;
    }

    const now = new Date();
    return await this.questionRepository
      .createQueryBuilder('question')
      .innerJoin('user_questions', 'uq', 'uq.question_id = question.id AND uq.user_id = :userId', { userId })
      .where('(uq.next_review_at IS NULL OR uq.next_review_at <= :now)', { now })
      .getCount();
  }

  async logPractice(createPracticeLogDto: CreatePracticeLogDto, userId?: string): Promise<PracticeLog> {
    const { questionId, selfRating, timeSpentSeconds, notes } = createPracticeLogDto;

    // Verify question exists
    const question = await this.questionRepository.findOne({ where: { id: questionId } });
    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    // Create practice log with user association
    const practiceLog = this.practiceLogRepository.create({
      questionId,
      userId,
      selfRating,
      timeSpentSeconds,
      notes,
    });

    // Save practice log
    await this.practiceLogRepository.save(practiceLog);

    // Update question practice count and last practiced date
    question.practiceCount += 1;
    question.lastPracticedAt = new Date();

    // Handle user-specific spaced repetition data
    let userQuestion: UserQuestion | null = null;

    if (userId) {
      // Find or create user-question relationship
      userQuestion = await this.userQuestionRepository.findOne({
        where: { userId, questionId },
      });

      if (!userQuestion) {
        userQuestion = this.userQuestionRepository.create({
          userId,
          questionId,
          easeFactor: 2.5,
          intervalDays: 0,
          repetitions: 0,
          nextReviewAt: null,
        });
      }

      // Calculate next review date using spaced repetition (user-specific)
      const { nextInterval, nextEaseFactor, nextRepetitions } =
        this.spacedRepetitionService.calculateNextReview(
          userQuestion.easeFactor,
          userQuestion.intervalDays,
          userQuestion.repetitions,
          selfRating,
        );

      // Update user question with spaced repetition data
      userQuestion.easeFactor = nextEaseFactor;
      userQuestion.intervalDays = nextInterval;
      userQuestion.repetitions = nextRepetitions;

      // Set next review date
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);
      userQuestion.nextReviewAt = nextReviewDate;

      await this.userQuestionRepository.save(userQuestion);

      // Update question status based on user's progress
      if (selfRating === SelfRating.GREAT) {
        if (userQuestion.repetitions >= 3) {
          question.status = QuestionStatus.MASTERED;
        } else {
          question.status = QuestionStatus.LEARNING;
        }
      } else if (selfRating === SelfRating.POOR) {
        question.status = QuestionStatus.LEARNING;
      }
    } else {
      // For non-authenticated users, still update global question status
      // (this is a fallback and won't persist across users)
      if (selfRating === SelfRating.GREAT) {
        question.status = QuestionStatus.LEARNING;
      } else if (selfRating === SelfRating.POOR) {
        question.status = QuestionStatus.LEARNING;
      }
    }

    await this.questionRepository.save(question);

    return practiceLog;
  }

  async getQuestionsDueForReview(locale: Locale = 'en', limit = 20, userId?: string): Promise<any[]> {
    const now = new Date();

    let questions: any[];

    if (userId) {
      // User-specific query: join with user_questions
      const rawQuestions = await this.questionRepository
        .createQueryBuilder('question')
        .leftJoin('user_questions', 'uq', 'uq.question_id = question.id AND uq.user_id = :userId', { userId })
        .where('(uq.next_review_at IS NULL OR uq.next_review_at <= :now)', { now })
        .andWhere('question.content_status = :contentStatus', { contentStatus: ContentStatus.APPROVED })
        .leftJoinAndSelect('question.topic', 'topic')
        .leftJoinAndSelect('question.translations', 'translations')
        .limit(limit)
        .getRawMany();

      // Map raw results to include user-specific SM-2 data
      const result = [];
      const seenIds = new Set();

      for (const row of rawQuestions) {
        const id = row.question_id;
        if (seenIds.has(id)) continue;
        seenIds.add(id);

        result.push({
          id: row.question_id,
          title: row.question_title,
          content: row.question_content,
          answer: row.question_answer,
          topicId: row.question_topicId,
          level: row.question_level,
          status: row.question_status,
          difficultyScore: row.question_difficultyScore,
          practiceCount: row.question_practiceCount,
          lastPracticedAt: row.question_lastPracticedAt,
          // Use user-specific SM-2 data from user_questions
          nextReviewAt: row.uq_next_review_at,
          easeFactor: row.uq_ease_factor ?? 2.5,
          intervalDays: row.uq_interval_days ?? 0,
          repetitions: row.uq_repetitions ?? 0,
          order: row.question_order,
          createdAt: row.question_createdAt,
          updatedAt: row.question_updatedAt,
          topic: row.topic_id ? {
            id: row.topic_id,
            name: row.topic_name,
            slug: row.topic_slug,
            description: row.topic_description,
            icon: row.topic_icon,
            color: row.topic_color,
            createdAt: row.topic_createdAt,
            updatedAt: row.topic_updatedAt,
          } : null,
          translations: [],
        });

        if (result.length >= limit) break;
      }

      questions = result;
    } else {
      // Non-authenticated: return all approved questions (no user-specific data)
      questions = await this.questionRepository
        .createQueryBuilder('question')
        .where('question.content_status = :contentStatus', { contentStatus: ContentStatus.APPROVED })
        .limit(limit)
        .leftJoinAndSelect('question.topic', 'topic')
        .leftJoinAndSelect('question.translations', 'translations')
        .getMany();

      questions = questions.map(q => ({
        ...q,
        nextReviewAt: null,
        easeFactor: 2.5,
        intervalDays: 0,
        repetitions: 0,
      }));
    }

    return questions.map((q: any) => ({
      ...this.translationService.formatQuestion(q, locale, true).data,
      easeFactor: q.easeFactor,
      intervalDays: q.intervalDays,
      repetitions: q.repetitions,
      nextReviewAt: q.nextReviewAt,
      dueStatus: this.spacedRepetitionService.getDueStatus(q.nextReviewAt),
    }));
  }

  async getStats(locale: Locale = 'en', userId?: string) {
    // Get total questions count
    const totalQuestions = await this.questionRepository.count();

    // Get user-specific or total logs count
    const totalLogs = userId
      ? await this.practiceLogRepository.count({ where: { userId } })
      : await this.practiceLogRepository.count();

    const questionsByStatus = await this.questionRepository
      .createQueryBuilder('question')
      .select('question.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('question.status')
      .getRawMany();

    const questionsByLevel = await this.questionRepository
      .createQueryBuilder('question')
      .select('question.level', 'level')
      .addSelect('COUNT(*)', 'count')
      .groupBy('question.level')
      .getRawMany();

    // User-specific practice by rating
    const practiceByRatingResult = userId
      ? await this.practiceLogRepository
          .createQueryBuilder('log')
          .select('log.selfRating', 'rating')
          .addSelect('COUNT(*)', 'count')
          .where('log.userId = :userId', { userId })
          .groupBy('log.selfRating')
          .getRawMany()
      : await this.practiceLogRepository.query(
          `SELECT self_rating as rating, COUNT(*) as count FROM practice_logs GROUP BY self_rating`,
        );

    const practiceByRating = practiceByRatingResult.length > 0 ? practiceByRatingResult : [];

    // Get user-specific or total practice time
    const timeResult = userId
      ? await this.practiceLogRepository
          .createQueryBuilder('log')
          .select('COALESCE(SUM(log.timeSpentSeconds), 0)', 'total')
          .where('log.userId = :userId', { userId })
          .andWhere('log.timeSpentSeconds IS NOT NULL')
          .getRawOne()
      : await this.practiceLogRepository.query(
          `SELECT COALESCE(SUM(time_spent_seconds), 0) as total FROM practice_logs WHERE time_spent_seconds IS NOT NULL`,
        );

    const totalPracticeTimeSeconds = timeResult?.total || 0;

    // Count questions due for review (user-specific or all)
    let questionsDueForReview: number;
    if (userId) {
      questionsDueForReview = await this.questionRepository
        .createQueryBuilder('question')
        .innerJoin('user_questions', 'uq', 'uq.question_id = question.id AND uq.user_id = :userId', { userId })
        .where('(uq.next_review_at IS NULL OR uq.next_review_at <= :now)', { now: new Date() })
        .getCount();
    } else {
      questionsDueForReview = await this.questionRepository
        .createQueryBuilder('question')
        .where('(question.next_review_at IS NULL OR question.next_review_at <= :now)', { now: new Date() })
        .getCount();
    }

    // Get recent practice logs (user-specific or global)
    const recentLogs = await this.practiceLogRepository.find({
      where: userId ? { userId } : {},
      relations: ['question', 'question.topic', 'question.translations'],
      order: { practicedAt: 'DESC' },
      take: 5,
    });

    return {
      totalQuestions,
      totalPracticeSessions: totalLogs,
      totalPracticeTimeSeconds,
      totalPracticeTimeMinutes: Math.round(totalPracticeTimeSeconds / 60),
      questionsByStatus: this.formatArrayAsObject(questionsByStatus),
      questionsByLevel: this.formatArrayAsObject(questionsByLevel),
      practiceByRating: this.formatArrayAsObject(practiceByRating),
      questionsNeedingReview: questionsDueForReview,
      recentLogs: recentLogs.map((log) => this.formatLogWithTranslations(log, locale)),
    };
  }

  async getHistory(limit = 20, locale: Locale = 'en', userId?: string) {
    const where = userId ? { userId } : {};
    const logs = await this.practiceLogRepository.find({
      where,
      relations: ['question', 'question.topic', 'question.translations'],
      order: { practicedAt: 'DESC' },
      take: limit,
    });

    return logs.map((log) => this.formatLogWithTranslations(log, locale));
  }

  private formatArrayAsObject(arr: any[]) {
    return arr.reduce((acc, item) => {
      const key = Object.values(item)[0] as string;
      const value = Object.values(item)[1] as number;
      acc[key] = value;
      return acc;
    }, {} as Record<string, number>);
  }

  private formatLogWithTranslations(log: PracticeLog, locale: Locale): Record<string, any> {
    return {
      id: log.id,
      questionId: log.question.id,
      questionTitle: this.translationService.getQuestionTitle(log.question, locale),
      topicName: log.question.topic ? this.translationService.getTopicName(log.question.topic, locale) : undefined,
      topicColor: log.question.topic?.color,
      level: log.question.level,
      rating: log.selfRating,
      timeSpentSeconds: log.timeSpentSeconds,
      notes: log.notes,
      practicedAt: log.practicedAt,
    };
  }
}
