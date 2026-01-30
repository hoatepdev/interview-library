import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Question, QuestionLevel, QuestionStatus } from '../database/entities/question.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { UpdateQuestionStatusDto } from './dto/update-question-status.dto';
import { QueryQuestionsDto } from './dto/query-questions.dto';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  async create(createQuestionDto: CreateQuestionDto): Promise<Question> {
    const question = this.questionRepository.create(createQuestionDto);
    return this.questionRepository.save(question);
  }

  async findAll(query: QueryQuestionsDto): Promise<Question[]> {
    const { topicId, level, status, favorite, search } = query;

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

    if (favorite !== undefined) {
      where.isFavorite = favorite;
    }

    if (search) {
      return this.questionRepository.find({
        where: [
          { ...where, title: Like(`%${search}%`) },
          { ...where, content: Like(`%${search}%`) },
        ],
        relations: ['topic'],
        order: { order: 'ASC', createdAt: 'DESC' },
      });
    }

    return this.questionRepository.find({
      where,
      relations: ['topic'],
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: ['topic'],
    });
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    return question;
  }

  async update(id: string, updateQuestionDto: UpdateQuestionDto): Promise<Question> {
    const question = await this.findOne(id);
    Object.assign(question, updateQuestionDto);
    return this.questionRepository.save(question);
  }

  async updateStatus(id: string, updateStatusDto: UpdateQuestionStatusDto): Promise<Question> {
    const question = await this.findOne(id);
    question.status = updateStatusDto.status;
    return this.questionRepository.save(question);
  }

  async toggleFavorite(id: string): Promise<Question> {
    const question = await this.findOne(id);
    question.isFavorite = !question.isFavorite;
    return this.questionRepository.save(question);
  }

  async remove(id: string): Promise<void> {
    const question = await this.findOne(id);
    await this.questionRepository.remove(question);
  }
}
