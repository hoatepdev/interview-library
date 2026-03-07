import { UserRole } from "../common/enums/role.enum";
import { ContentStatus } from "../common/enums/content-status.enum";
import { QuestionLevel } from "../database/entities/question.entity";
import { User } from "../database/entities/user.entity";
import { Question } from "../database/entities/question.entity";
import { Topic } from "../database/entities/topic.entity";
import { QuestionRevision } from "../database/entities/question-revision.entity";
import { ContentReview, ReviewAction, ReviewTargetType } from "../database/entities/content-review.entity";

/**
 * Creates a mock TypeORM Repository with all common methods stubbed.
 * Usage: const mockRepo = createMockRepository<MyEntity>();
 */
export function createMockRepository<T = any>() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    recover: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    target: undefined as any,
    createQueryBuilder: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
      getManyAndCount: jest.fn(),
      getCount: jest.fn(),
      getRawOne: jest.fn(),
      getRawMany: jest.fn(),
    }),
    getRepository: jest.fn(),
    metadata: {
      columns: [],
      relations: [],
      tableName: "mock_table",
    },
  };
}

/**
 * Creates a mock DataSource with transaction support.
 * The transaction callback is called immediately with a mock manager.
 */
export function createMockDataSource() {
  const mockManager = {
    getRepository: jest.fn().mockReturnValue(createMockRepository()),
  };

  return {
    transaction: jest.fn().mockImplementation(async (cb: any) => {
      return cb(mockManager);
    }),
    getRepository: jest.fn().mockReturnValue(createMockRepository()),
    manager: mockManager,
  };
}

// ─── Entity Factories ─────────────────────────────────────────────────────────

export function createMockUser(overrides: Partial<User> = {}): User {
  const user = new User();
  user.id = overrides.id ?? "user-uuid-1";
  user.email = overrides.email ?? "test@example.com";
  user.name = overrides.name ?? "Test User";
  user.avatar = overrides.avatar ?? null;
  user.role = overrides.role ?? UserRole.USER;
  user.provider = overrides.provider ?? "google";
  user.providerId = overrides.providerId ?? "google-123";
  user.createdAt = overrides.createdAt ?? new Date("2024-01-01");
  user.updatedAt = overrides.updatedAt ?? new Date("2024-01-01");
  user.deletedAt = overrides.deletedAt ?? null;
  user.deletedBy = overrides.deletedBy ?? null;
  return user;
}

export function createMockTopic(overrides: Partial<Topic> = {}): Topic {
  const topic = new Topic();
  topic.id = overrides.id ?? "topic-uuid-1";
  topic.name = overrides.name ?? "JavaScript";
  topic.slug = overrides.slug ?? "javascript";
  topic.color = overrides.color ?? "#F7DF1E";
  topic.icon = overrides.icon ?? "code";
  topic.description = overrides.description ?? "JavaScript questions";
  topic.contentStatus = overrides.contentStatus ?? ContentStatus.APPROVED;
  topic.createdAt = overrides.createdAt ?? new Date("2024-01-01");
  topic.updatedAt = overrides.updatedAt ?? new Date("2024-01-01");
  topic.deletedAt = overrides.deletedAt ?? null;
  topic.deletedBy = overrides.deletedBy ?? null;
  return topic;
}

export function createMockQuestion(overrides: Partial<Question> = {}): Question {
  const question = new Question();
  question.id = overrides.id ?? "question-uuid-1";
  question.title = overrides.title ?? "What is a closure?";
  question.content = overrides.content ?? "Explain the concept of closures in JavaScript.";
  question.answer = overrides.answer ?? "A closure is a function that retains access to its outer scope.";
  question.topicId = overrides.topicId ?? "topic-uuid-1";
  question.topic = overrides.topic ?? createMockTopic();
  question.level = overrides.level ?? QuestionLevel.MIDDLE;
  question.userId = overrides.userId ?? "user-uuid-1";
  question.difficultyScore = overrides.difficultyScore ?? 0;
  question.contentStatus = overrides.contentStatus ?? ContentStatus.APPROVED;
  question.reviewNote = overrides.reviewNote ?? null;
  question.displayOrder = overrides.displayOrder ?? 0;
  question.createdAt = overrides.createdAt ?? new Date("2024-01-01");
  question.updatedAt = overrides.updatedAt ?? new Date("2024-01-01");
  question.deletedAt = overrides.deletedAt ?? null;
  question.deletedBy = overrides.deletedBy ?? null;
  return question;
}

export function createMockRevision(overrides: Partial<QuestionRevision> = {}): QuestionRevision {
  const revision = new QuestionRevision();
  revision.id = overrides.id ?? "revision-uuid-1";
  revision.questionId = overrides.questionId ?? "question-uuid-1";
  revision.question = overrides.question ?? createMockQuestion();
  revision.submittedBy = overrides.submittedBy ?? "user-uuid-1";
  revision.title = overrides.title ?? "Updated: What is a closure?";
  revision.content = overrides.content ?? "Updated content explaining closures.";
  revision.answer = overrides.answer ?? "Updated answer about closures.";
  revision.level = overrides.level ?? QuestionLevel.MIDDLE;
  revision.topicId = overrides.topicId ?? "topic-uuid-1";
  revision.contentStatus = overrides.contentStatus ?? ContentStatus.PENDING_REVIEW;
  revision.reviewNote = overrides.reviewNote ?? null;
  revision.reviewedBy = overrides.reviewedBy ?? null;
  revision.reviewedAt = overrides.reviewedAt ?? null;
  revision.createdAt = overrides.createdAt ?? new Date("2024-01-01");
  revision.deletedAt = overrides.deletedAt ?? null;
  revision.deletedBy = overrides.deletedBy ?? null;
  return revision;
}

export function createMockContentReview(overrides: Partial<ContentReview> = {}): ContentReview {
  const review = new ContentReview();
  review.id = overrides.id ?? "review-uuid-1";
  review.targetType = overrides.targetType ?? ReviewTargetType.QUESTION;
  review.targetId = overrides.targetId ?? "question-uuid-1";
  review.action = overrides.action ?? ReviewAction.APPROVED;
  review.note = overrides.note ?? null;
  review.reviewerId = overrides.reviewerId ?? "admin-uuid-1";
  review.createdAt = overrides.createdAt ?? new Date("2024-01-01");
  return review;
}
