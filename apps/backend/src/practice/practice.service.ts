import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Raw } from "typeorm";
import { Question } from "../database/entities/question.entity";
import { ContentStatus } from "../common/enums/content-status.enum";
import { PracticeLog } from "../database/entities/practice-log.entity";
import { UserQuestion } from "../database/entities/user-question.entity";
import { CreatePracticeLogDto } from "./dto/create-practice-log.dto";
import { QueryPracticeDto } from "./dto/query-practice.dto";
import { type Locale } from "@interview-library/shared/i18n";
import { TranslationService } from "../i18n/translation.service";
import { SpacedRepetitionService } from "./spaced-repetition.service";
import {
  QuestionStatus,
  getQuestionStatus,
} from "../common/utils/question-status.util";

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

  async getRandomQuestion(
    query: QueryPracticeDto,
    locale: Locale = "en",
    userId?: string,
  ): Promise<any> {
    const { topicId, level, status, excludeQuestionId } = query;

    const where: any = {};

    if (topicId) {
      where.topicId = topicId;
    }

    if (level) {
      where.level = level;
    }

    // Only serve approved questions in practice mode
    where.contentStatus = ContentStatus.APPROVED;

    // Exclude a specific question (useful for getting next question)
    if (excludeQuestionId) {
      where.id = Raw((alias) => `${alias} != :excludeId`, {
        excludeId: excludeQuestionId,
      });
    }

    let questions = await this.questionRepository.find({
      where,
      relations: ["topic", "translations"],
    });

    // Post-filter by derived status if requested
    if (status && userId) {
      const questionIds = questions.map((q) => q.id);
      const userQuestions =
        questionIds.length > 0
          ? await this.userQuestionRepository
              .createQueryBuilder("uq")
              .where(
                "uq.userId = :userId AND uq.questionId IN (:...questionIds)",
                { userId, questionIds },
              )
              .getMany()
          : [];
      const uqMap = new Map(userQuestions.map((uq) => [uq.questionId, uq]));
      questions = questions.filter(
        (q) => getQuestionStatus(uqMap.get(q.id)?.repetitions ?? 0) === status,
      );
    }

    if (questions.length === 0) {
      throw new NotFoundException("No questions found matching the criteria");
    }

    // Return a random question with translations
    const randomIndex = Math.floor(Math.random() * questions.length);
    const formatted = this.translationService.formatQuestion(
      questions[randomIndex],
      locale,
      true,
    ).data;
    formatted.status = QuestionStatus.NEW;

    if (userId) {
      const uq = await this.userQuestionRepository.findOne({
        where: { userId, questionId: questions[randomIndex].id },
      });
      formatted.status = getQuestionStatus(uq?.repetitions ?? 0);
    }

    return formatted;
  }

  /**
   * Get next question for practice (Smart Practice mode)
   * Prioritizes due questions for authenticated users, falls back to random
   */
  async getNextQuestionForPractice(
    query: QueryPracticeDto,
    locale: Locale = "en",
    userId?: string,
  ): Promise<any> {
    const { topicId, level, status, excludeQuestionId } = query;

    // For authenticated users, try to get due questions first
    if (userId) {
      const now = new Date();

      // Build the base query for due questions
      const dueQuery = this.questionRepository
        .createQueryBuilder("question")
        .leftJoin(
          "user_questions",
          "uq",
          "uq.question_id = question.id AND uq.user_id = :userId AND uq.deleted_at IS NULL",
          { userId },
        )
        .where("(uq.next_review_at IS NULL OR uq.next_review_at <= :now)", {
          now,
        })
        .andWhere("question.content_status = :contentStatus", {
          contentStatus: ContentStatus.APPROVED,
        })
        .leftJoinAndSelect("question.topic", "topic")
        .leftJoinAndSelect("question.translations", "translations")
        .addSelect("uq.repetitions", "uq_repetitions")
        .addSelect("uq.ease_factor", "uq_ease_factor")
        .addSelect("uq.interval_days", "uq_interval_days")
        .addSelect("uq.next_review_at", "uq_next_review_at");

      // Apply filters
      if (topicId) {
        dueQuery.andWhere("question.topicId = :topicId", { topicId });
      }
      if (level) {
        dueQuery.andWhere("question.level = :level", { level });
      }
      if (status) {
        // Filter by derived status using SM-2 repetitions
        if (status === QuestionStatus.NEW) {
          dueQuery.andWhere("(uq.repetitions IS NULL OR uq.repetitions = 0)");
        } else if (status === QuestionStatus.LEARNING) {
          dueQuery.andWhere("uq.repetitions >= 1 AND uq.repetitions <= 3");
        } else if (status === QuestionStatus.MASTERED) {
          dueQuery.andWhere("uq.repetitions >= 4");
        }
      }
      if (excludeQuestionId) {
        dueQuery.andWhere("question.id != :excludeQuestionId", {
          excludeQuestionId,
        });
      }

      // Get raw results to include uq fields
      const rawResults = await dueQuery.limit(1).getRawAndEntities();

      if (rawResults.entities.length > 0) {
        const question = rawResults.entities[0];
        const raw = rawResults.raw[0];

        const repetitions = raw?.uq_repetitions ?? 0;
        const formatted = this.translationService.formatQuestion(
          question,
          locale,
          true,
        ).data;

        return {
          ...formatted,
          status: getQuestionStatus(repetitions),
          isPrioritized: true,
          nextReviewAt: raw?.uq_next_review_at,
          easeFactor: raw?.uq_ease_factor ?? 2.5,
          intervalDays: raw?.uq_interval_days ?? 0,
          repetitions,
        };
      }
    }

    // No due questions or not authenticated - fall back to random
    return {
      ...(await this.getRandomQuestion(query, locale, userId)),
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
      .createQueryBuilder("question")
      .innerJoin(
        "user_questions",
        "uq",
        "uq.question_id = question.id AND uq.user_id = :userId AND uq.deleted_at IS NULL",
        { userId },
      )
      .where("(uq.next_review_at IS NULL OR uq.next_review_at <= :now)", {
        now,
      })
      .getCount();
  }

  async logPractice(
    createPracticeLogDto: CreatePracticeLogDto,
    userId?: string,
  ): Promise<PracticeLog> {
    const { questionId, selfRating, timeSpentSeconds, notes } =
      createPracticeLogDto;

    // Verify question exists
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
    });
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

    // SM-2 state lives exclusively in user_questions
    if (userId) {
      // Find or create user-question relationship
      let userQuestion = await this.userQuestionRepository.findOne({
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

      // Calculate next review using SM-2 algorithm
      const { nextInterval, nextEaseFactor, nextRepetitions } =
        this.spacedRepetitionService.calculateNextReview(
          userQuestion.easeFactor,
          userQuestion.intervalDays,
          userQuestion.repetitions,
          selfRating,
        );

      userQuestion.easeFactor = nextEaseFactor;
      userQuestion.intervalDays = nextInterval;
      userQuestion.repetitions = nextRepetitions;

      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);
      userQuestion.nextReviewAt = nextReviewDate;

      await this.userQuestionRepository.save(userQuestion);
    }

    return practiceLog;
  }

  async getQuestionsDueForReview(
    locale: Locale = "en",
    limit = 20,
    userId?: string,
  ): Promise<any[]> {
    const now = new Date();

    let questions: any[];

    if (userId) {
      // User-specific query: join with user_questions
      const rawQuestions = await this.questionRepository
        .createQueryBuilder("question")
        .leftJoin(
          "user_questions",
          "uq",
          "uq.question_id = question.id AND uq.user_id = :userId AND uq.deleted_at IS NULL",
          { userId },
        )
        .where("(uq.next_review_at IS NULL OR uq.next_review_at <= :now)", {
          now,
        })
        .andWhere("question.content_status = :contentStatus", {
          contentStatus: ContentStatus.APPROVED,
        })
        .leftJoinAndSelect("question.topic", "topic")
        .leftJoinAndSelect("question.translations", "translations")
        .limit(limit)
        .getRawMany();

      // Map raw results to include user-specific SM-2 data
      const result = [];
      const seenIds = new Set();

      for (const row of rawQuestions) {
        const id = row.question_id;
        if (seenIds.has(id)) continue;
        seenIds.add(id);

        const repetitions = row.uq_repetitions ?? 0;
        result.push({
          id: row.question_id,
          title: row.question_title,
          content: row.question_content,
          answer: row.question_answer,
          topicId: row.question_topicId,
          level: row.question_level,
          status: getQuestionStatus(repetitions),
          difficultyScore: row.question_difficultyScore,
          // Use user-specific SM-2 data from user_questions
          nextReviewAt: row.uq_next_review_at,
          easeFactor: row.uq_ease_factor ?? 2.5,
          intervalDays: row.uq_interval_days ?? 0,
          repetitions,
          displayOrder: row.question_displayOrder,
          createdAt: row.question_createdAt,
          updatedAt: row.question_updatedAt,
          topic: row.topic_id
            ? {
                id: row.topic_id,
                name: row.topic_name,
                slug: row.topic_slug,
                description: row.topic_description,
                icon: row.topic_icon,
                color: row.topic_color,
                createdAt: row.topic_createdAt,
                updatedAt: row.topic_updatedAt,
              }
            : null,
          translations: [],
        });

        if (result.length >= limit) break;
      }

      questions = result;
    } else {
      // Non-authenticated: return all approved questions (no user-specific data)
      questions = await this.questionRepository
        .createQueryBuilder("question")
        .where("question.content_status = :contentStatus", {
          contentStatus: ContentStatus.APPROVED,
        })
        .limit(limit)
        .leftJoinAndSelect("question.topic", "topic")
        .leftJoinAndSelect("question.translations", "translations")
        .getMany();

      questions = questions.map((q) => ({
        ...q,
        status: QuestionStatus.NEW,
        nextReviewAt: null,
        easeFactor: 2.5,
        intervalDays: 0,
        repetitions: 0,
      }));
    }

    return questions.map((q: any) => ({
      ...this.translationService.formatQuestion(q, locale, true).data,
      status: q.status,
      easeFactor: q.easeFactor,
      intervalDays: q.intervalDays,
      repetitions: q.repetitions,
      nextReviewAt: q.nextReviewAt,
      dueStatus: this.spacedRepetitionService.getDueStatus(q.nextReviewAt),
    }));
  }

  async getStats(locale: Locale = "en", userId?: string) {
    // Get total questions count
    const totalQuestions = await this.questionRepository.count();

    // Get user-specific or total logs count
    const totalLogs = userId
      ? await this.practiceLogRepository.count({ where: { userId } })
      : await this.practiceLogRepository.count();

    // Derive questionsByStatus from user_questions SM-2 data
    let questionsByStatus: Record<string, number>;
    if (userId) {
      const uqRows = await this.userQuestionRepository
        .createQueryBuilder("uq")
        .select("uq.repetitions", "repetitions")
        .where("uq.userId = :userId", { userId })
        .getRawMany();

      const statusCounts = { new: 0, learning: 0, mastered: 0 };
      for (const row of uqRows) {
        const s = getQuestionStatus(row.repetitions ?? 0);
        statusCounts[s]++;
      }
      // Count questions without a user_questions row as "new"
      const trackedCount = uqRows.length;
      const untrackedNew = totalQuestions - trackedCount;
      statusCounts.new += untrackedNew;
      questionsByStatus = statusCounts;
    } else {
      // No user context: all questions are "new"
      questionsByStatus = { new: totalQuestions, learning: 0, mastered: 0 };
    }

    const questionsByLevel = await this.questionRepository
      .createQueryBuilder("question")
      .select("question.level", "level")
      .addSelect("COUNT(*)", "count")
      .groupBy("question.level")
      .getRawMany();

    // User-specific practice by rating
    const practiceByRatingResult = userId
      ? await this.practiceLogRepository
          .createQueryBuilder("log")
          .select("log.selfRating", "rating")
          .addSelect("COUNT(*)", "count")
          .where("log.userId = :userId", { userId })
          .groupBy("log.selfRating")
          .getRawMany()
      : await this.practiceLogRepository.query(
          `SELECT self_rating as rating, COUNT(*) as count FROM practice_logs GROUP BY self_rating`,
        );

    const practiceByRating =
      practiceByRatingResult.length > 0 ? practiceByRatingResult : [];

    // Get user-specific or total practice time
    const timeResult = userId
      ? await this.practiceLogRepository
          .createQueryBuilder("log")
          .select("COALESCE(SUM(log.timeSpentSeconds), 0)", "total")
          .where("log.userId = :userId", { userId })
          .andWhere("log.timeSpentSeconds IS NOT NULL")
          .getRawOne()
      : await this.practiceLogRepository.query(
          `SELECT COALESCE(SUM(time_spent_seconds), 0) as total FROM practice_logs WHERE time_spent_seconds IS NOT NULL`,
        );

    const totalPracticeTimeSeconds = timeResult?.total || 0;

    // Count questions due for review (user-specific only)
    let questionsDueForReview: number;
    if (userId) {
      questionsDueForReview = await this.questionRepository
        .createQueryBuilder("question")
        .innerJoin(
          "user_questions",
          "uq",
          "uq.question_id = question.id AND uq.user_id = :userId AND uq.deleted_at IS NULL",
          { userId },
        )
        .where("(uq.next_review_at IS NULL OR uq.next_review_at <= :now)", {
          now: new Date(),
        })
        .getCount();
    } else {
      questionsDueForReview = 0;
    }

    // Get recent practice logs (user-specific or global)
    const recentLogs = await this.practiceLogRepository.find({
      where: userId ? { userId } : {},
      relations: ["question", "question.topic", "question.translations"],
      order: { practicedAt: "DESC" },
      take: 5,
    });

    return {
      totalQuestions,
      totalPracticeSessions: totalLogs,
      totalPracticeTimeSeconds,
      totalPracticeTimeMinutes: Math.round(totalPracticeTimeSeconds / 60),
      questionsByStatus,
      questionsByLevel: this.formatArrayAsObject(questionsByLevel),
      practiceByRating: this.formatArrayAsObject(practiceByRating),
      questionsNeedingReview: questionsDueForReview,
      recentLogs: recentLogs.map((log) =>
        this.formatLogWithTranslations(log, locale),
      ),
    };
  }

  async getAnalytics(locale: Locale = "en", userId?: string, days = 30) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // 1. Daily activity (sessions + time per day)
    const dailyActivityQuery = this.practiceLogRepository
      .createQueryBuilder("log")
      .select("TO_CHAR(log.practicedAt, 'YYYY-MM-DD')", "date")
      .addSelect("COUNT(*)", "sessions")
      .addSelect("COALESCE(SUM(log.timeSpentSeconds), 0)", "timeSpentSeconds")
      .where("log.practicedAt >= :sinceDate", { sinceDate });

    if (userId) {
      dailyActivityQuery.andWhere("log.userId = :userId", { userId });
    }

    const dailyActivityRaw = await dailyActivityQuery
      .groupBy("TO_CHAR(log.practicedAt, 'YYYY-MM-DD')")
      .orderBy("TO_CHAR(log.practicedAt, 'YYYY-MM-DD')", "ASC")
      .getRawMany();

    const dailyActivity = dailyActivityRaw.map((row: any) => ({
      date: row.date,
      sessions: Number(row.sessions),
      timeSpentMinutes: Math.round(Number(row.timeSpentSeconds) / 60),
    }));

    // 2. Topic mastery breakdown — derived from user_questions SM-2 data
    let topicMastery: {
      topicId: string;
      topicName: string;
      topicColor: string;
      new: number;
      learning: number;
      mastered: number;
      total: number;
    }[];

    if (userId) {
      // Get all questions with their topics + user's repetitions
      const rows = await this.questionRepository
        .createQueryBuilder("question")
        .leftJoin("question.topic", "topic")
        .leftJoin(
          "user_questions",
          "uq",
          "uq.question_id = question.id AND uq.user_id = :userId AND uq.deleted_at IS NULL",
          { userId },
        )
        .select("topic.id", "topicId")
        .addSelect("topic.name", "topicName")
        .addSelect("topic.color", "topicColor")
        .addSelect("COALESCE(uq.repetitions, 0)", "repetitions")
        .where("question.topicId IS NOT NULL")
        .getRawMany();

      const topicMap = new Map<
        string,
        {
          topicId: string;
          topicName: string;
          topicColor: string;
          new: number;
          learning: number;
          mastered: number;
          total: number;
        }
      >();
      for (const row of rows) {
        const existing = topicMap.get(row.topicId) || {
          topicId: row.topicId,
          topicName: row.topicName,
          topicColor: row.topicColor || "#6366f1",
          new: 0,
          learning: 0,
          mastered: 0,
          total: 0,
        };
        const s = getQuestionStatus(Number(row.repetitions));
        existing[s]++;
        existing.total++;
        topicMap.set(row.topicId, existing);
      }
      topicMastery = Array.from(topicMap.values());
    } else {
      // No user context: all questions are "new"
      const rows = await this.questionRepository
        .createQueryBuilder("question")
        .leftJoin("question.topic", "topic")
        .select("topic.id", "topicId")
        .addSelect("topic.name", "topicName")
        .addSelect("topic.color", "topicColor")
        .addSelect("COUNT(*)", "count")
        .where("question.topicId IS NOT NULL")
        .groupBy("topic.id")
        .addGroupBy("topic.name")
        .addGroupBy("topic.color")
        .getRawMany();

      topicMastery = rows.map((row: any) => ({
        topicId: row.topicId,
        topicName: row.topicName,
        topicColor: row.topicColor || "#6366f1",
        new: Number(row.count),
        learning: 0,
        mastered: 0,
        total: Number(row.count),
      }));
    }

    // 3. Study streak calculation
    const streakQuery = this.practiceLogRepository
      .createQueryBuilder("log")
      .select("DISTINCT TO_CHAR(log.practicedAt, 'YYYY-MM-DD')", "date");

    if (userId) {
      streakQuery.where("log.userId = :userId", { userId });
    }

    const streakDatesRaw = await streakQuery
      .orderBy("TO_CHAR(log.practicedAt, 'YYYY-MM-DD')", "DESC")
      .getRawMany();

    const practiceDates = streakDatesRaw.map((r: any) => r.date);
    const { current, longest } = this.calculateStreaks(practiceDates);

    // 4. Rating trend over time (last N days)
    const ratingTrendQuery = this.practiceLogRepository
      .createQueryBuilder("log")
      .select("TO_CHAR(log.practicedAt, 'YYYY-MM-DD')", "date")
      .addSelect("log.selfRating", "rating")
      .addSelect("COUNT(*)", "count")
      .where("log.practicedAt >= :sinceDate", { sinceDate });

    if (userId) {
      ratingTrendQuery.andWhere("log.userId = :userId", { userId });
    }

    const ratingTrendRaw = await ratingTrendQuery
      .groupBy("TO_CHAR(log.practicedAt, 'YYYY-MM-DD')")
      .addGroupBy("log.selfRating")
      .orderBy("TO_CHAR(log.practicedAt, 'YYYY-MM-DD')", "ASC")
      .getRawMany();

    const ratingTrendMap = new Map<
      string,
      { date: string; poor: number; fair: number; good: number; great: number }
    >();
    for (const row of ratingTrendRaw) {
      const existing = ratingTrendMap.get(row.date) || {
        date: row.date,
        poor: 0,
        fair: 0,
        good: 0,
        great: 0,
      };
      existing[row.rating as "poor" | "fair" | "good" | "great"] = Number(
        row.count,
      );
      ratingTrendMap.set(row.date, existing);
    }
    const ratingTrend = Array.from(ratingTrendMap.values());

    return {
      dailyActivity,
      topicMastery,
      streak: { current, longest },
      ratingTrend,
    };
  }

  private calculateStreaks(sortedDatesDesc: string[]): {
    current: number;
    longest: number;
  } {
    if (sortedDatesDesc.length === 0) {
      return { current: 0, longest: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    // Current streak: must include today or yesterday
    let current = 0;
    if (
      sortedDatesDesc[0] === todayStr ||
      sortedDatesDesc[0] === yesterdayStr
    ) {
      current = 1;
      for (let i = 1; i < sortedDatesDesc.length; i++) {
        const prev = new Date(sortedDatesDesc[i - 1]);
        const curr = new Date(sortedDatesDesc[i]);
        const diffDays =
          (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
          current++;
        } else {
          break;
        }
      }
    }

    // Longest streak
    let longest = 1;
    let streakLen = 1;
    for (let i = 1; i < sortedDatesDesc.length; i++) {
      const prev = new Date(sortedDatesDesc[i - 1]);
      const curr = new Date(sortedDatesDesc[i]);
      const diffDays =
        (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        streakLen++;
        longest = Math.max(longest, streakLen);
      } else {
        streakLen = 1;
      }
    }

    return { current, longest: Math.max(longest, current) };
  }

  async getHistory(limit = 20, locale: Locale = "en", userId?: string) {
    const where = userId ? { userId } : {};
    const logs = await this.practiceLogRepository.find({
      where,
      relations: ["question", "question.topic", "question.translations"],
      order: { practicedAt: "DESC" },
      take: limit,
    });

    return logs.map((log) => this.formatLogWithTranslations(log, locale));
  }

  private formatArrayAsObject(arr: any[]) {
    return arr.reduce(
      (acc, item) => {
        const key = Object.values(item)[0] as string;
        const value = Object.values(item)[1] as number;
        acc[key] = value;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private formatLogWithTranslations(
    log: PracticeLog,
    locale: Locale,
  ): Record<string, any> {
    return {
      id: log.id,
      questionId: log.question.id,
      questionTitle: this.translationService.getQuestionTitle(
        log.question,
        locale,
      ),
      topicName: log.question.topic
        ? this.translationService.getTopicName(log.question.topic, locale)
        : undefined,
      topicColor: log.question.topic?.color,
      level: log.question.level,
      rating: log.selfRating,
      timeSpentSeconds: log.timeSpentSeconds,
      notes: log.notes,
      practicedAt: log.practicedAt,
    };
  }
}
