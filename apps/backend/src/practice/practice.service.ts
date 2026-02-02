import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw, LessThanOrEqual } from 'typeorm';
import { Question, QuestionStatus } from '../database/entities/question.entity';
import { PracticeLog, SelfRating } from '../database/entities/practice-log.entity';
import { CreatePracticeLogDto } from './dto/create-practice-log.dto';
import { QueryPracticeDto } from './dto/query-practice.dto';
import { TranslationService, Locale } from '../i18n/translation.service';
import { SpacedRepetitionService } from './spaced-repetition.service';

@Injectable()
export class PracticeService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(PracticeLog)
    private readonly practiceLogRepository: Repository<PracticeLog>,
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

  async logPractice(createPracticeLogDto: CreatePracticeLogDto): Promise<PracticeLog> {
    const { questionId, selfRating, timeSpentSeconds, notes } = createPracticeLogDto;

    // Verify question exists
    const question = await this.questionRepository.findOne({ where: { id: questionId } });
    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    // Create practice log
    const practiceLog = this.practiceLogRepository.create({
      questionId,
      selfRating,
      timeSpentSeconds,
      notes,
    });

    // Save practice log
    await this.practiceLogRepository.save(practiceLog);

    // Update question practice count and last practiced date
    question.practiceCount += 1;
    question.lastPracticedAt = new Date();

    // Calculate next review date using spaced repetition
    const { nextInterval, nextEaseFactor, nextRepetitions } =
      this.spacedRepetitionService.calculateNextReview(
        question.easeFactor,
        question.intervalDays,
        question.repetitions,
        selfRating,
      );

    // Update question with spaced repetition data
    question.easeFactor = nextEaseFactor;
    question.intervalDays = nextInterval;
    question.repetitions = nextRepetitions;

    // Set next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);
    question.nextReviewAt = nextReviewDate;

    // Auto-update status based on rating
    if (selfRating === SelfRating.GREAT) {
      if (question.repetitions >= 3) {
        question.status = QuestionStatus.MASTERED;
      } else {
        question.status = QuestionStatus.LEARNING;
      }
    } else if (selfRating === SelfRating.POOR) {
      question.status = QuestionStatus.LEARNING;
    }

    await this.questionRepository.save(question);

    return practiceLog;
  }

  async getQuestionsDueForReview(locale: Locale = 'en', limit = 20): Promise<any[]> {
    const now = new Date();

    const questions = await this.questionRepository
      .createQueryBuilder('question')
      .where('(question.next_review_at IS NULL OR question.next_review_at <= :now)', { now })
      .leftJoinAndSelect('question.topic', 'topic')
      .leftJoinAndSelect('question.translations', 'translations')
      .limit(limit)
      .getRawMany();

    // Map raw results to entities
    const result = [];
    const seenIds = new Set();

    for (const row of questions) {
      const id = row.question_id;
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      const question = this.questionRepository.create({
        id: row.question_id,
        title: row.question_title,
        content: row.question_content,
        answer: row.question_answer,
        topicId: row.question_topicId,
        level: row.question_level,
        status: row.question_status,
        isFavorite: row.question_isFavorite,
        difficultyScore: row.question_difficultyScore,
        practiceCount: row.question_practiceCount,
        lastPracticedAt: row.question_lastPracticedAt,
        nextReviewAt: row.question_nextReviewAt,
        easeFactor: row.question_easeFactor,
        intervalDays: row.question_intervalDays,
        repetitions: row.question_repetitions,
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

      result.push(question);
      if (result.length >= limit) break;
    }

    return result.map(q => ({
      ...this.translationService.formatQuestion(q, locale, true).data,
      easeFactor: q.easeFactor,
      intervalDays: q.intervalDays,
      repetitions: q.repetitions,
      nextReviewAt: q.nextReviewAt,
      dueStatus: this.spacedRepetitionService.getDueStatus(q.nextReviewAt),
    }));
  }

  async getStats(locale: Locale = 'en') {
    const totalQuestions = await this.questionRepository.count();
    const totalLogs = await this.practiceLogRepository.count();

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

    const practiceByRatingResult = await this.practiceLogRepository.query(
      `SELECT self_rating as rating, COUNT(*) as count FROM practice_logs GROUP BY self_rating`,
    );

    const practiceByRating = practiceByRatingResult.length > 0 ? practiceByRatingResult : [];

    // Get total practice time
    const timeResult = await this.practiceLogRepository.query(
      `SELECT COALESCE(SUM(time_spent_seconds), 0) as total FROM practice_logs WHERE time_spent_seconds IS NOT NULL`,
    );

    const totalPracticeTimeSeconds = timeResult[0]?.total || 0;

    // Count questions due for review
    const questionsDueForReview = await this.questionRepository
      .createQueryBuilder('question')
      .where('(question.next_review_at IS NULL OR question.next_review_at <= :now)', { now: new Date() })
      .getCount();

    // Get recent practice logs
    const recentLogs = await this.practiceLogRepository.find({
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

  async getHistory(limit = 20, locale: Locale = 'en') {
    const logs = await this.practiceLogRepository.find({
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
