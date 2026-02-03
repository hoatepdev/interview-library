import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm';
import { Question, QuestionLevel, QuestionStatus } from '../database/entities/question.entity';
import { QuestionFavorite } from '../database/entities/question-favorite.entity';
import { Topic } from '../database/entities/topic.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { UpdateQuestionStatusDto } from './dto/update-question-status.dto';
import { QueryQuestionsDto } from './dto/query-questions.dto';
import { TranslationService, Locale } from '../i18n/translation.service';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(QuestionFavorite)
    private readonly questionFavoriteRepository: Repository<QuestionFavorite>,
    @InjectRepository(Topic)
    private readonly topicRepository: Repository<Topic>,
    private readonly translationService: TranslationService,
    private readonly dataSource: DataSource,
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

    // Filter by favorites if requested
    if (favorite === true && userId) {
      const favoriteQuestionIds = await this.questionFavoriteRepository
        .createQueryBuilder('qf')
        .where('qf.userId = :userId', { userId })
        .select('qf.questionId')
        .getMany();

      const favoriteIds = new Set(favoriteQuestionIds.map(f => f.questionId));
      questions = questions.filter(q => favoriteIds.has(q.id));
    } else if (favorite === true && !userId) {
      // If filtering by favorites but no user, return empty
      return [];
    }

    // Format with translations and isFavorite status
    return await Promise.all(questions.map(async q => {
      const formatted = this.translationService.formatQuestion(q, locale, true).data;

      // Check if this question is favorited by the user
      if (userId) {
        const favorite = await this.questionFavoriteRepository.findOne({
          where: { userId, questionId: q.id },
        });
        formatted.isFavorite = !!favorite;
      } else {
        formatted.isFavorite = false;
      }

      return formatted;
    }));
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

    // Check if this question is favorited by the user
    if (userId) {
      const favorite = await this.questionFavoriteRepository.findOne({
        where: { userId, questionId: id },
      });
      formatted.isFavorite = !!favorite;
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

    // Check if already favorited
    const existingFavorite = await this.questionFavoriteRepository.findOne({
      where: { userId, questionId: id },
    });

    if (existingFavorite) {
      // Remove from favorites
      await this.questionFavoriteRepository.remove(existingFavorite);
      return { isFavorite: false };
    } else {
      // Add to favorites
      const favorite = this.questionFavoriteRepository.create({
        userId,
        questionId: id,
      });
      await this.questionFavoriteRepository.save(favorite);
      return { isFavorite: true };
    }
  }

  async remove(id: string): Promise<void> {
    const question = await this.questionRepository.findOne({
      where: { id },
    });
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    await this.questionRepository.remove(question);
  }
}
