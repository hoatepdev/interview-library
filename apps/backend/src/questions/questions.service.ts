import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Question, QuestionLevel, QuestionStatus } from '../database/entities/question.entity';
import { UserQuestion } from '../database/entities/user-question.entity';
import { Topic } from '../database/entities/topic.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { UpdateQuestionStatusDto } from './dto/update-question-status.dto';
import { QueryQuestionsDto } from './dto/query-questions.dto';
import { type Locale } from '@interview-library/shared/i18n';
import { TranslationService } from '../i18n/translation.service';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(UserQuestion)
    private readonly userQuestionRepository: Repository<UserQuestion>,
    @InjectRepository(Topic)
    private readonly topicRepository: Repository<Topic>,
    private readonly translationService: TranslationService,
  ) {}

  async create(createQuestionDto: CreateQuestionDto): Promise<Question> {
    const question = this.questionRepository.create(createQuestionDto);
    return this.questionRepository.save(question);
  }

  async findAll(query: QueryQuestionsDto, locale: Locale = 'en', userId?: string): Promise<any[]> {
    const { topicId, level, status, search, favorite } = query;

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

    let questions: Question[];

    if (search) {
      questions = await this.questionRepository.find({
        where: [
          { ...where, title: Like(`%${search}%`) },
          { ...where, content: Like(`%${search}%`) },
        ],
        relations: ['topic', 'translations'],
        order: { order: 'ASC', createdAt: 'DESC' },
      });
    } else {
      questions = await this.questionRepository.find({
        where,
        relations: ['topic', 'translations'],
        order: { order: 'ASC', createdAt: 'DESC' },
      });
    }

    // Fetch all favorited question IDs for this user in one query
    const userFavoriteIds = userId
      ? new Set(
          (await this.userQuestionRepository
            .createQueryBuilder('uq')
            .where('uq.userId = :userId AND uq.isFavorite = true', { userId })
            .select('uq.questionId')
            .getMany()).map(r => r.questionId),
        )
      : new Set<string>();

    // Filter by favorites if requested
    if (favorite === true && userId) {
      questions = questions.filter(q => userFavoriteIds.has(q.id));
    } else if (favorite === true && !userId) {
      // If filtering by favorites but no user, return empty
      return [];
    }

    // Format with translations and isFavorite status
    return questions.map(q => {
      const formatted = this.translationService.formatQuestion(q, locale, true).data;
      formatted.isFavorite = userFavoriteIds.has(q.id);
      return formatted;
    });
  }

  async getByTopicSlug(slug: string, query: QueryQuestionsDto, locale: Locale = 'en', userId?: string): Promise<any[]> {
    // First find topic by slug to get its ID
    const topic = await this.topicRepository.findOne({
      where: { slug },
      select: ['id'],
    });

    if (!topic) {
      throw new NotFoundException(`Topic with slug "${slug}" not found`);
    }

    // Then query questions by topicId using the existing logic
    return this.findAll({ ...query, topicId: topic.id }, locale, userId);
  }

  async findOne(id: string, locale: Locale = 'en', userId?: string): Promise<any> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: ['topic', 'translations'],
    });
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    const formatted = this.translationService.formatQuestion(question, locale, true).data;

    if (userId) {
      const uq = await this.userQuestionRepository.findOne({ where: { userId, questionId: id } });
      formatted.isFavorite = !!uq?.isFavorite;
    } else {
      formatted.isFavorite = false;
    }

    return formatted;
  }

  async update(id: string, updateQuestionDto: UpdateQuestionDto): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: ['translations'],
    });
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    Object.assign(question, updateQuestionDto);
    return this.questionRepository.save(question);
  }

  async updateStatus(id: string, updateStatusDto: UpdateQuestionStatusDto): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id },
    });
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    question.status = updateStatusDto.status;
    return this.questionRepository.save(question);
  }

  async toggleFavorite(id: string, userId: string): Promise<{ isFavorite: boolean }> {
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated to favorite questions');
    }

    // Verify question exists
    const question = await this.questionRepository.findOne({
      where: { id },
    });
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    const existing = await this.userQuestionRepository.findOne({ where: { userId, questionId: id } });

    if (existing) {
      existing.isFavorite = !existing.isFavorite;
      await this.userQuestionRepository.save(existing);
      return { isFavorite: existing.isFavorite };
    } else {
      const uq = this.userQuestionRepository.create({
        userId,
        questionId: id,
        isFavorite: true,
        easeFactor: 2.5,
        intervalDays: 0,
        repetitions: 0,
      });
      await this.userQuestionRepository.save(uq);
      return { isFavorite: true };
    }
  }

  async remove(id: string, userId?: string): Promise<void> {
    const question = await this.questionRepository.findOne({
      where: { id },
    });
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    // Check ownership: only the creator can delete the question
    if (question.userId && question.userId !== userId) {
      throw new UnauthorizedException('You do not have permission to delete this question');
    }

    await this.questionRepository.remove(question);
  }
}
