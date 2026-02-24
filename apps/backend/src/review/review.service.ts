import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Question } from "../database/entities/question.entity";
import { QuestionRevision } from "../database/entities/question-revision.entity";
import {
  ContentReview,
  ReviewAction,
  ReviewTargetType,
} from "../database/entities/content-review.entity";
import { ContentStatus } from "../common/enums/content-status.enum";

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(QuestionRevision)
    private readonly revisionRepository: Repository<QuestionRevision>,
    @InjectRepository(ContentReview)
    private readonly contentReviewRepository: Repository<ContentReview>,
  ) {}

  async getPendingItems(): Promise<{
    questions: Question[];
    revisions: QuestionRevision[];
  }> {
    const questions = await this.questionRepository.find({
      where: { contentStatus: ContentStatus.PENDING_REVIEW },
      relations: ["user", "topic"],
      order: { createdAt: "ASC" },
    });
    const revisions = await this.revisionRepository.find({
      where: { contentStatus: ContentStatus.PENDING_REVIEW },
      relations: ["question", "question.topic", "submitter"],
      order: { createdAt: "ASC" },
    });
    return { questions, revisions };
  }

  async getPendingCount(): Promise<{ count: number }> {
    const questionCount = await this.questionRepository.count({
      where: { contentStatus: ContentStatus.PENDING_REVIEW },
    });
    const revisionCount = await this.revisionRepository.count({
      where: { contentStatus: ContentStatus.PENDING_REVIEW },
    });
    return { count: questionCount + revisionCount };
  }

  async getRevision(revisionId: string): Promise<QuestionRevision> {
    const revision = await this.revisionRepository.findOne({
      where: { id: revisionId },
      relations: ["question", "question.topic", "submitter"],
    });
    if (!revision) {
      throw new NotFoundException(`Revision with ID ${revisionId} not found`);
    }
    return revision;
  }

  async approveQuestion(
    questionId: string,
    reviewerId: string,
    note?: string,
  ): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
    });
    if (!question)
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    if (question.contentStatus !== ContentStatus.PENDING_REVIEW) {
      throw new BadRequestException("Question is not pending review");
    }

    question.contentStatus = ContentStatus.APPROVED;
    question.reviewNote = note || null;
    await this.questionRepository.save(question);

    await this.contentReviewRepository.save(
      this.contentReviewRepository.create({
        targetType: ReviewTargetType.QUESTION,
        targetId: questionId,
        action: ReviewAction.APPROVED,
        note,
        reviewerId,
      }),
    );

    return question;
  }

  async rejectQuestion(
    questionId: string,
    reviewerId: string,
    note: string,
  ): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
    });
    if (!question)
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    if (question.contentStatus !== ContentStatus.PENDING_REVIEW) {
      throw new BadRequestException("Question is not pending review");
    }

    question.contentStatus = ContentStatus.REJECTED;
    question.reviewNote = note;
    await this.questionRepository.save(question);

    await this.contentReviewRepository.save(
      this.contentReviewRepository.create({
        targetType: ReviewTargetType.QUESTION,
        targetId: questionId,
        action: ReviewAction.REJECTED,
        note,
        reviewerId,
      }),
    );

    return question;
  }

  async approveRevision(
    revisionId: string,
    reviewerId: string,
    note?: string,
  ): Promise<Question> {
    const revision = await this.revisionRepository.findOne({
      where: { id: revisionId },
      relations: ["question"],
    });
    if (!revision)
      throw new NotFoundException(`Revision with ID ${revisionId} not found`);
    if (revision.contentStatus !== ContentStatus.PENDING_REVIEW) {
      throw new BadRequestException("Revision is not pending review");
    }

    // Apply revision fields to the question
    const question = revision.question;
    question.title = revision.title;
    question.content = revision.content;
    question.answer = revision.answer;
    if (revision.level) question.level = revision.level;
    if (revision.topicId) question.topicId = revision.topicId;
    await this.questionRepository.save(question);

    revision.contentStatus = ContentStatus.APPROVED;
    revision.reviewedBy = reviewerId;
    revision.reviewedAt = new Date();
    revision.reviewNote = note || null;
    await this.revisionRepository.save(revision);

    await this.contentReviewRepository.save(
      this.contentReviewRepository.create({
        targetType: ReviewTargetType.QUESTION_REVISION,
        targetId: revisionId,
        action: ReviewAction.APPROVED,
        note,
        reviewerId,
      }),
    );

    return question;
  }

  async rejectRevision(
    revisionId: string,
    reviewerId: string,
    note: string,
  ): Promise<QuestionRevision> {
    const revision = await this.revisionRepository.findOne({
      where: { id: revisionId },
    });
    if (!revision)
      throw new NotFoundException(`Revision with ID ${revisionId} not found`);
    if (revision.contentStatus !== ContentStatus.PENDING_REVIEW) {
      throw new BadRequestException("Revision is not pending review");
    }

    revision.contentStatus = ContentStatus.REJECTED;
    revision.reviewedBy = reviewerId;
    revision.reviewedAt = new Date();
    revision.reviewNote = note;
    await this.revisionRepository.save(revision);

    await this.contentReviewRepository.save(
      this.contentReviewRepository.create({
        targetType: ReviewTargetType.QUESTION_REVISION,
        targetId: revisionId,
        action: ReviewAction.REJECTED,
        note,
        reviewerId,
      }),
    );

    return revision;
  }

  async getHistory(limit = 50): Promise<ContentReview[]> {
    return this.contentReviewRepository.find({
      relations: ["reviewer"],
      order: { createdAt: "DESC" },
      take: limit,
    });
  }
}
