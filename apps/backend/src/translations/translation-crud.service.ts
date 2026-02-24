import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Topic } from "../database/entities/topic.entity";
import { Question } from "../database/entities/question.entity";
import { TopicTranslation } from "../database/entities/topic-translation.entity";
import { QuestionTranslation } from "../database/entities/question-translation.entity";
import { type Locale } from "@interview-library/shared/i18n";

// DTOs for translation CRUD
export interface CreateTopicTranslationDto {
  topicId: string;
  locale: Locale;
  name: string;
  description?: string;
}

export interface UpdateTopicTranslationDto {
  name?: string;
  description?: string;
}

export interface CreateQuestionTranslationDto {
  questionId: string;
  locale: Locale;
  title: string;
  content: string;
  answer?: string;
}

export interface UpdateQuestionTranslationDto {
  title?: string;
  content?: string;
  answer?: string;
}

@Injectable()
export class TranslationService {
  constructor(
    @InjectRepository(Topic)
    private readonly topicRepository: Repository<Topic>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(TopicTranslation)
    private readonly topicTranslationRepository: Repository<TopicTranslation>,
    @InjectRepository(QuestionTranslation)
    private readonly questionTranslationRepository: Repository<QuestionTranslation>,
  ) {}

  // ==================== Topic Translations ====================

  async getTopicTranslations(topicId: string): Promise<TopicTranslation[]> {
    return this.topicTranslationRepository.find({
      where: { topicId },
      order: { locale: "ASC" },
    });
  }

  async getTopicTranslation(
    topicId: string,
    locale: Locale,
  ): Promise<TopicTranslation> {
    const translation = await this.topicTranslationRepository.findOne({
      where: { topicId, locale },
    });
    if (!translation) {
      throw new NotFoundException(
        `Translation for topic ${topicId} in locale ${locale} not found`,
      );
    }
    return translation;
  }

  async createTopicTranslation(
    dto: CreateTopicTranslationDto,
  ): Promise<TopicTranslation> {
    // Verify topic exists
    const topic = await this.topicRepository.findOne({
      where: { id: dto.topicId },
    });
    if (!topic) {
      throw new NotFoundException(`Topic with ID ${dto.topicId} not found`);
    }

    // Check if translation already exists
    const existing = await this.topicTranslationRepository.findOne({
      where: { topicId: dto.topicId, locale: dto.locale },
    });
    if (existing) {
      throw new ConflictException(
        `Translation for topic ${dto.topicId} in locale ${dto.locale} already exists`,
      );
    }

    const translation = this.topicTranslationRepository.create(dto);
    return this.topicTranslationRepository.save(translation);
  }

  async updateTopicTranslation(
    topicId: string,
    locale: Locale,
    dto: UpdateTopicTranslationDto,
  ): Promise<TopicTranslation> {
    const translation = await this.topicTranslationRepository.findOne({
      where: { topicId, locale },
    });
    if (!translation) {
      throw new NotFoundException(
        `Translation for topic ${topicId} in locale ${locale} not found`,
      );
    }
    Object.assign(translation, dto);
    return this.topicTranslationRepository.save(translation);
  }

  async deleteTopicTranslation(topicId: string, locale: Locale): Promise<void> {
    const translation = await this.topicTranslationRepository.findOne({
      where: { topicId, locale },
    });
    if (!translation) {
      throw new NotFoundException(
        `Translation for topic ${topicId} in locale ${locale} not found`,
      );
    }
    await this.topicTranslationRepository.remove(translation);
  }

  // ==================== Question Translations ====================

  async getQuestionTranslations(
    questionId: string,
  ): Promise<QuestionTranslation[]> {
    return this.questionTranslationRepository.find({
      where: { questionId },
      order: { locale: "ASC" },
    });
  }

  async getQuestionTranslation(
    questionId: string,
    locale: Locale,
  ): Promise<QuestionTranslation> {
    const translation = await this.questionTranslationRepository.findOne({
      where: { questionId, locale },
    });
    if (!translation) {
      throw new NotFoundException(
        `Translation for question ${questionId} in locale ${locale} not found`,
      );
    }
    return translation;
  }

  async createQuestionTranslation(
    dto: CreateQuestionTranslationDto,
  ): Promise<QuestionTranslation> {
    // Verify question exists
    const question = await this.questionRepository.findOne({
      where: { id: dto.questionId },
    });
    if (!question) {
      throw new NotFoundException(
        `Question with ID ${dto.questionId} not found`,
      );
    }

    // Check if translation already exists
    const existing = await this.questionTranslationRepository.findOne({
      where: { questionId: dto.questionId, locale: dto.locale },
    });
    if (existing) {
      throw new ConflictException(
        `Translation for question ${dto.questionId} in locale ${dto.locale} already exists`,
      );
    }

    const translation = this.questionTranslationRepository.create(dto);
    return this.questionTranslationRepository.save(translation);
  }

  async updateQuestionTranslation(
    questionId: string,
    locale: Locale,
    dto: UpdateQuestionTranslationDto,
  ): Promise<QuestionTranslation> {
    const translation = await this.questionTranslationRepository.findOne({
      where: { questionId, locale },
    });
    if (!translation) {
      throw new NotFoundException(
        `Translation for question ${questionId} in locale ${locale} not found`,
      );
    }
    Object.assign(translation, dto);
    return this.questionTranslationRepository.save(translation);
  }

  async deleteQuestionTranslation(
    questionId: string,
    locale: Locale,
  ): Promise<void> {
    const translation = await this.questionTranslationRepository.findOne({
      where: { questionId, locale },
    });
    if (!translation) {
      throw new NotFoundException(
        `Translation for question ${questionId} in locale ${locale} not found`,
      );
    }
    await this.questionTranslationRepository.remove(translation);
  }

  // ==================== Bulk Operations ====================

  async getMissingTranslations(
    entityType: "topics" | "questions",
    locale: Locale,
  ): Promise<any[]> {
    if (entityType === "topics") {
      return this.topicRepository
        .createQueryBuilder("topic")
        .leftJoin(
          "topic.translations",
          "translation",
          "translation.locale = :locale",
        )
        .setParameter("locale", locale)
        .where("translation.id IS NULL")
        .select(["topic.id", "topic.name"])
        .getMany();
    } else {
      return this.questionRepository
        .createQueryBuilder("question")
        .leftJoin(
          "question.translations",
          "translation",
          "translation.locale = :locale",
        )
        .setParameter("locale", locale)
        .where("translation.id IS NULL")
        .select(["question.id", "question.title"])
        .getMany();
    }
  }
}
