import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like, In, DataSource, IsNull } from "typeorm";
import { Question, QuestionLevel } from "../database/entities/question.entity";
import { QuestionRevision } from "../database/entities/question-revision.entity";
import { UserQuestion } from "../database/entities/user-question.entity";
import { Topic } from "../database/entities/topic.entity";
import { User } from "../database/entities/user.entity";
import { ContentStatus } from "../common/enums/content-status.enum";
import { UserRole } from "../common/enums/role.enum";
import {
  QuestionStatus,
  getQuestionStatus,
} from "../common/utils/question-status.util";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { QueryQuestionsDto } from "./dto/query-questions.dto";
import { type Locale } from "@interview-library/shared/i18n";
import { TranslationService } from "../i18n/translation.service";
import { softDelete, restore } from "../common/utils/soft-delete.util";
import { DomainEventService } from "../common/services/domain-event.service";
import { DomainEventAction } from "../database/entities/domain-event.entity";
import { DomainDeleteBlockedException } from "../common/exceptions/domain-delete-blocked.exception";

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(QuestionRevision)
    private readonly revisionRepository: Repository<QuestionRevision>,
    @InjectRepository(UserQuestion)
    private readonly userQuestionRepository: Repository<UserQuestion>,
    @InjectRepository(Topic)
    private readonly topicRepository: Repository<Topic>,
    private readonly translationService: TranslationService,
    private readonly domainEventService: DomainEventService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createQuestionDto: CreateQuestionDto,
    user: User,
  ): Promise<Question> {
    const isPrivileged =
      user.role === UserRole.MODERATOR || user.role === UserRole.ADMIN;
    const question = this.questionRepository.create({
      ...createQuestionDto,
      userId: user.id,
      contentStatus: isPrivileged
        ? ContentStatus.APPROVED
        : ContentStatus.PENDING_REVIEW,
    });
    return this.questionRepository.save(question);
  }

  async findAll(
    query: QueryQuestionsDto,
    locale: Locale = "en",
    user?: User,
  ): Promise<any[]> {
    const { topicId, level, status, search, favorite, contentStatus } = query;

    const isPrivileged =
      user &&
      (user.role === UserRole.MODERATOR || user.role === UserRole.ADMIN);

    let questions: Question[];

    if (isPrivileged && contentStatus) {
      // MOD/ADMIN with explicit contentStatus filter
      const where: any = { contentStatus };
      if (topicId) where.topicId = topicId;
      if (level) where.level = level;

      questions = search
        ? await this.questionRepository.find({
            where: [
              { ...where, title: Like(`%${search}%`) },
              { ...where, content: Like(`%${search}%`) },
            ],
            relations: ["topic", "translations"],
            order: { displayOrder: "ASC", createdAt: "DESC" },
          })
        : await this.questionRepository.find({
            where,
            relations: ["topic", "translations"],
            order: { displayOrder: "ASC", createdAt: "DESC" },
          });
    } else {
      // Public or regular user: show APPROVED + own pending
      const baseWhere: any = {};
      if (topicId) baseWhere.topicId = topicId;
      if (level) baseWhere.level = level;

      const approvedWhere = {
        ...baseWhere,
        contentStatus: ContentStatus.APPROVED,
      };

      if (search) {
        const approvedResults = await this.questionRepository.find({
          where: [
            { ...approvedWhere, title: Like(`%${search}%`) },
            { ...approvedWhere, content: Like(`%${search}%`) },
          ],
          relations: ["topic", "translations"],
          order: { displayOrder: "ASC", createdAt: "DESC" },
        });

        if (user) {
          const ownPendingWhere = {
            ...baseWhere,
            userId: user.id,
            contentStatus: ContentStatus.PENDING_REVIEW,
          };
          const ownPending = await this.questionRepository.find({
            where: [
              { ...ownPendingWhere, title: Like(`%${search}%`) },
              { ...ownPendingWhere, content: Like(`%${search}%`) },
            ],
            relations: ["topic", "translations"],
            order: { displayOrder: "ASC", createdAt: "DESC" },
          });
          questions = [...approvedResults, ...ownPending];
        } else {
          questions = approvedResults;
        }
      } else {
        const approvedResults = await this.questionRepository.find({
          where: approvedWhere,
          relations: ["topic", "translations"],
          order: { displayOrder: "ASC", createdAt: "DESC" },
        });

        if (user) {
          const ownPending = await this.questionRepository.find({
            where: {
              ...baseWhere,
              userId: user.id,
              contentStatus: ContentStatus.PENDING_REVIEW,
            },
            relations: ["topic", "translations"],
            order: { displayOrder: "ASC", createdAt: "DESC" },
          });
          questions = [...approvedResults, ...ownPending];
        } else {
          questions = approvedResults;
        }
      }
    }

    // Fetch user_questions for status derivation and favorites
    const userId = user?.id;
    const questionIds = questions.map((q) => q.id);

    const userQuestions =
      userId && questionIds.length > 0
        ? await this.userQuestionRepository.find({
            where: { userId, questionId: In(questionIds) },
          })
        : [];

    const uqMap = new Map(userQuestions.map((uq) => [uq.questionId, uq]));

    // Filter by favorites if requested
    const userFavoriteIds = new Set(
      userQuestions.filter((uq) => uq.isFavorite).map((uq) => uq.questionId),
    );

    if (favorite === true && userId) {
      questions = questions.filter((q) => userFavoriteIds.has(q.id));
    } else if (favorite === true && !userId) {
      return [];
    }

    // Format with translations, derived status, and isFavorite
    const result = questions.map((q) => {
      const formatted = this.translationService.formatQuestion(
        q,
        locale,
        true,
      ).data;
      const uq = uqMap.get(q.id);
      formatted.status = getQuestionStatus(uq?.repetitions ?? 0);
      formatted.isFavorite = userFavoriteIds.has(q.id);
      formatted.contentStatus = q.contentStatus;
      return formatted;
    });

    // Post-filter by derived status if requested
    if (status) {
      return result.filter((q) => q.status === status);
    }

    return result;
  }

  async getByTopicSlug(
    slug: string,
    query: QueryQuestionsDto,
    locale: Locale = "en",
    user?: User,
  ): Promise<any[]> {
    const topic = await this.topicRepository.findOne({
      where: { slug },
      select: ["id"],
    });

    if (!topic) {
      throw new NotFoundException(`Topic with slug "${slug}" not found`);
    }

    return this.findAll({ ...query, topicId: topic.id }, locale, user);
  }

  async findOne(id: string, locale: Locale = "en", user?: User): Promise<any> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: ["topic", "translations"],
    });
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    const isPrivileged =
      user &&
      (user.role === UserRole.MODERATOR || user.role === UserRole.ADMIN);
    const isOwner = user && question.userId === user.id;

    // Only show non-approved content to privileged users or the owner
    if (
      question.contentStatus !== ContentStatus.APPROVED &&
      !isPrivileged &&
      !isOwner
    ) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    const formatted = this.translationService.formatQuestion(
      question,
      locale,
      true,
    ).data;
    formatted.contentStatus = question.contentStatus;

    if (user) {
      const uq = await this.userQuestionRepository.findOne({
        where: { userId: user.id, questionId: id },
      });
      formatted.isFavorite = !!uq?.isFavorite;
      formatted.status = getQuestionStatus(uq?.repetitions ?? 0);
    } else {
      formatted.isFavorite = false;
      formatted.status = QuestionStatus.NEW;
    }

    return formatted;
  }

  async update(
    id: string,
    updateQuestionDto: UpdateQuestionDto,
    user: User,
  ): Promise<Question | QuestionRevision> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: ["translations"],
    });
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    const isPrivileged =
      user.role === UserRole.MODERATOR || user.role === UserRole.ADMIN;

    // MOD/ADMIN: direct edit, stays approved
    if (isPrivileged) {
      Object.assign(question, updateQuestionDto);
      question.contentStatus = ContentStatus.APPROVED;
      return this.questionRepository.save(question);
    }

    // USER: must be owner
    if (question.userId !== user.id) {
      throw new ForbiddenException("You can only edit your own questions");
    }

    // If question is approved, create a revision instead of modifying
    if (question.contentStatus === ContentStatus.APPROVED) {
      const revision = this.revisionRepository.create({
        questionId: question.id,
        submittedBy: user.id,
        title: updateQuestionDto.title ?? question.title,
        content: updateQuestionDto.content ?? question.content,
        answer:
          updateQuestionDto.answer !== undefined
            ? updateQuestionDto.answer
            : question.answer,
        level: updateQuestionDto.level ?? question.level,
        topicId: updateQuestionDto.topicId ?? question.topicId,
        contentStatus: ContentStatus.PENDING_REVIEW,
      });
      return this.revisionRepository.save(revision);
    }

    // If question is still PENDING_REVIEW or DRAFT, update in-place
    Object.assign(question, updateQuestionDto);
    return this.questionRepository.save(question);
  }

  async toggleFavorite(
    id: string,
    userId: string,
  ): Promise<{ isFavorite: boolean }> {
    if (!userId) {
      throw new UnauthorizedException(
        "User must be authenticated to favorite questions",
      );
    }

    const question = await this.questionRepository.findOne({
      where: { id },
    });
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    const existing = await this.userQuestionRepository.findOne({
      where: { userId, questionId: id },
    });

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

  async remove(id: string, user: User, force = false): Promise<void> {
    const question = await this.questionRepository.findOne({
      where: { id },
    });
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    const isPrivileged =
      user.role === UserRole.MODERATOR || user.role === UserRole.ADMIN;

    if (!isPrivileged && question.userId !== user.id) {
      throw new UnauthorizedException(
        "You do not have permission to delete this question",
      );
    }

    // Count active user_questions referencing this question
    const activeUserQuestionCount = await this.userQuestionRepository.count({
      where: { questionId: id, deletedAt: IsNull() },
      withDeleted: true,
    });

    if (activeUserQuestionCount > 0 && !force) {
      throw new DomainDeleteBlockedException(
        "question",
        id,
        `${activeUserQuestionCount} active user_question(s) reference this question`,
        activeUserQuestionCount,
      );
    }

    await this.dataSource.transaction(async (manager) => {
      if (activeUserQuestionCount > 0 && force) {
        const activeUqs = await manager.getRepository(UserQuestion).find({
          where: { questionId: id },
        });
        for (const uq of activeUqs) {
          await softDelete(
            this.userQuestionRepository,
            uq.id,
            user.id,
            manager,
          );
        }
      }

      await softDelete(this.questionRepository, id, user.id, manager);

      await this.domainEventService.log(
        "question",
        id,
        force ? DomainEventAction.FORCE_DELETED : DomainEventAction.DELETED,
        user.id,
        {
          cascadedUserQuestions: force ? activeUserQuestionCount : 0,
          questionTitle: question.title,
          topicId: question.topicId,
        },
        manager,
      );
    });
  }

  async restore(id: string, actorId?: string): Promise<Question> {
    return restore(this.questionRepository, id, {
      entityType: "question",
      parentRefs: [
        {
          repository: this.topicRepository as Repository<any>,
          foreignKey: "topicId",
          parentType: "topic",
        },
      ],
      actorId,
      domainEventService: this.domainEventService,
    });
  }
}
