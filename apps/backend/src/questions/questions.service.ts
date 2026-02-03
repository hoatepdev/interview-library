import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Question, QuestionLevel, QuestionStatus } from '../database/entities/question.entity';
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
    private readonly translationService: TranslationService,
  ) {}

  async create(createQuestionDto: CreateQuestionDto): Promise<Question> {
    const question = this.questionRepository.create(createQuestionDto);
    return this.questionRepository.save(question);
  }

  async findAll(query: QueryQuestionsDto, locale: Locale = 'en'): Promise<any[]> {
    const { topicId, level, status, search } = query;

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

    // TODO: Implement favorites filtering using QuestionFavorite table
    // if (favorite !== undefined) {

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

    // Format with translations
    return questions.map(q => this.translationService.formatQuestion(q, locale, true).data);
  }

  async findOne(id: string, locale: Locale = 'en'): Promise<any> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: ['topic', 'translations'],
    });
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    return this.translationService.formatQuestion(question, locale, true).data;
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

  // TODO: Implement toggleFavorite using QuestionFavorite table
  // async toggleFavorite(id: string): Promise<Question> {
  //   const question = await this.questionRepository.findOne({
  //     where: { id },
  //   });
  //   if (!question) {
  //     throw new NotFoundException(`Question with ID ${id} not found`);
  //   }
  //   question.isFavorite = !question.isFavorite;
  //   return this.questionRepository.save(question);
  // }

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
