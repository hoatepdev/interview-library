import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, IsNull } from "typeorm";
import { Topic } from "../database/entities/topic.entity";
import { Question } from "../database/entities/question.entity";
import { CreateTopicDto } from "./dto/create-topic.dto";
import { UpdateTopicDto } from "./dto/update-topic.dto";
import { type Locale } from "@interview-library/shared/i18n";
import { TranslationService } from "../i18n/translation.service";
import { softDelete, restore } from "../common/utils/soft-delete.util";
import { DomainEventService } from "../common/services/domain-event.service";
import { DomainEventAction } from "../database/entities/domain-event.entity";
import { DomainDeleteBlockedException } from "../common/exceptions/domain-delete-blocked.exception";

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic)
    private readonly topicRepository: Repository<Topic>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    private readonly translationService: TranslationService,
    private readonly domainEventService: DomainEventService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createTopicDto: CreateTopicDto): Promise<Topic> {
    // Auto-generate slug from name if not provided
    if (!createTopicDto.slug) {
      createTopicDto.slug = this.generateSlug(createTopicDto.name);
    }
    const topic = this.topicRepository.create(createTopicDto);
    return this.topicRepository.save(topic);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, "") // Remove non-alphanumeric chars except hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  }

  async findAll(locale: Locale = "en", includeDeleted = false): Promise<any[]> {
    const qb = this.topicRepository
      .createQueryBuilder("topic")
      .leftJoinAndSelect("topic.translations", "translation")
      .loadRelationCountAndMap(
        "topic.questionsCount",
        "topic.questions",
        "q",
        (qb) => qb.andWhere("q.deleted_at IS NULL"),
      )
      .orderBy("topic.name", "ASC");

    if (includeDeleted) {
      qb.withDeleted();
    }

    const topics = await qb.getMany();

    return topics.map((topic) => ({
      ...this.translationService.formatTopic(topic, locale).data,
      questionsCount: (topic as any).questionsCount || 0,
      ...(includeDeleted && topic.deletedAt
        ? { deletedAt: topic.deletedAt }
        : {}),
    }));
  }

  async findOne(id: string, locale: Locale = "en"): Promise<any> {
    const topic = await this.topicRepository
      .createQueryBuilder("topic")
      .where("topic.id = :id", { id })
      .leftJoinAndSelect("topic.translations", "translation")
      .loadRelationCountAndMap(
        "topic.questionsCount",
        "topic.questions",
        "q",
        (qb) => qb.andWhere("q.deleted_at IS NULL"),
      )
      .getOne();

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }
    return {
      ...this.translationService.formatTopic(topic, locale).data,
      questionsCount: (topic as any).questionsCount || 0,
    };
  }

  async findBySlug(slug: string, locale: Locale = "en"): Promise<any> {
    const topic = await this.topicRepository
      .createQueryBuilder("topic")
      .where("topic.slug = :slug", { slug })
      .leftJoinAndSelect("topic.translations", "translation")
      .loadRelationCountAndMap(
        "topic.questionsCount",
        "topic.questions",
        "q",
        (qb) => qb.andWhere("q.deleted_at IS NULL"),
      )
      .getOne();

    if (!topic) {
      throw new NotFoundException(`Topic with slug ${slug} not found`);
    }
    return {
      ...this.translationService.formatTopic(topic, locale).data,
      questionsCount: (topic as any).questionsCount || 0,
    };
  }

  async update(id: string, updateTopicDto: UpdateTopicDto): Promise<Topic> {
    const topic = await this.topicRepository.findOne({
      where: { id },
      relations: ["translations"],
    });
    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }
    // Auto-generate slug from name if name changed and slug not provided
    if (updateTopicDto.name && !updateTopicDto.slug) {
      updateTopicDto.slug = this.generateSlug(updateTopicDto.name);
    }
    Object.assign(topic, updateTopicDto);
    return this.topicRepository.save(topic);
  }

  async remove(
    id: string,
    deletedByUserId: string,
    force = false,
  ): Promise<void> {
    const topic = await this.topicRepository.findOne({ where: { id } });
    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }

    // Count active child questions
    const activeQuestionCount = await this.questionRepository.count({
      where: { topicId: id, deletedAt: IsNull() },
      withDeleted: true,
    });

    if (activeQuestionCount > 0 && !force) {
      throw new DomainDeleteBlockedException(
        "topic",
        id,
        `${activeQuestionCount} active question(s) reference this topic`,
        activeQuestionCount,
      );
    }

    // Transaction: cascade soft-delete children then the topic
    await this.dataSource.transaction(async (manager) => {
      if (activeQuestionCount > 0 && force) {
        // Soft-delete all active child questions
        const activeQuestions = await manager.getRepository(Question).find({
          where: { topicId: id },
        });
        for (const question of activeQuestions) {
          await softDelete(
            this.questionRepository,
            question.id,
            deletedByUserId,
            manager,
          );
        }
      }

      await softDelete(this.topicRepository, id, deletedByUserId, manager);

      await this.domainEventService.log(
        "topic",
        id,
        force ? DomainEventAction.FORCE_DELETED : DomainEventAction.DELETED,
        deletedByUserId,
        {
          cascadedQuestions: force ? activeQuestionCount : 0,
          topicSlug: topic.slug,
        },
        manager,
      );
    });
  }

  async restore(id: string, actorId?: string): Promise<Topic> {
    return restore(this.topicRepository, id, {
      entityType: "topic",
      uniqueConstraints: [{ fields: ["slug"], label: "slug" }],
      actorId,
      domainEventService: this.domainEventService,
    });
  }

  // Helper to get translated name
  getTranslatedName(topic: Topic, locale: Locale = "en"): string {
    return this.translationService.getTopicName(topic, locale);
  }
}
