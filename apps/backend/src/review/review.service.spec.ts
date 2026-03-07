import { NotFoundException, BadRequestException } from "@nestjs/common";
import { ReviewService } from "./review.service";
import { ContentStatus } from "../common/enums/content-status.enum";
import { ReviewAction, ReviewTargetType } from "../database/entities/content-review.entity";
import {
  createMockRepository,
  createMockDataSource,
  createMockQuestion,
  createMockRevision,
  createMockContentReview,
} from "../test/test-utils";

describe("ReviewService", () => {
  let service: ReviewService;
  let questionRepo: ReturnType<typeof createMockRepository>;
  let revisionRepo: ReturnType<typeof createMockRepository>;
  let contentReviewRepo: ReturnType<typeof createMockRepository>;
  let mockDataSource: ReturnType<typeof createMockDataSource>;

  // Repos exposed inside transaction
  let txQuestionRepo: ReturnType<typeof createMockRepository>;
  let txRevisionRepo: ReturnType<typeof createMockRepository>;
  let txContentReviewRepo: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    questionRepo = createMockRepository();
    revisionRepo = createMockRepository();
    contentReviewRepo = createMockRepository();

    txQuestionRepo = createMockRepository();
    txRevisionRepo = createMockRepository();
    txContentReviewRepo = createMockRepository();
    txContentReviewRepo.create.mockImplementation((dto: any) => dto);
    txContentReviewRepo.save.mockResolvedValue(createMockContentReview());

    mockDataSource = createMockDataSource();
    mockDataSource.transaction.mockImplementation(async (cb: any) => {
      return cb({
        getRepository: jest.fn().mockImplementation((Entity: any) => {
          const name = typeof Entity === "string" ? Entity : Entity?.name ?? "";
          if (name === "Question") return txQuestionRepo;
          if (name === "QuestionRevision") return txRevisionRepo;
          if (name === "ContentReview") return txContentReviewRepo;
          return createMockRepository();
        }),
      });
    });

    service = new ReviewService(
      questionRepo as any,
      revisionRepo as any,
      contentReviewRepo as any,
      mockDataSource as any,
    );
  });

  // ─── approveQuestion ───────────────────────────────────────────────────────

  describe("approveQuestion", () => {
    it("approves a pending question and creates a ContentReview record", async () => {
      const question = createMockQuestion({
        contentStatus: ContentStatus.PENDING_REVIEW,
      });
      questionRepo.findOne.mockResolvedValue(question);
      questionRepo.save.mockResolvedValue({ ...question, contentStatus: ContentStatus.APPROVED });
      contentReviewRepo.create.mockImplementation((dto) => dto);
      contentReviewRepo.save.mockResolvedValue(createMockContentReview());

      const result = await service.approveQuestion("question-uuid-1", "admin-uuid-1", "Good question");

      expect(questionRepo.findOne).toHaveBeenCalledWith({ where: { id: "question-uuid-1" } });
      expect(question.contentStatus).toBe(ContentStatus.APPROVED);
      expect(question.reviewNote).toBe("Good question");
      expect(questionRepo.save).toHaveBeenCalledWith(question);
      expect(contentReviewRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          targetType: ReviewTargetType.QUESTION,
          targetId: "question-uuid-1",
          action: ReviewAction.APPROVED,
          reviewerId: "admin-uuid-1",
          note: "Good question",
        }),
      );
      expect(contentReviewRepo.save).toHaveBeenCalled();
      expect(result).toEqual(question);
    });

    it("sets reviewNote to null when no note provided", async () => {
      const question = createMockQuestion({ contentStatus: ContentStatus.PENDING_REVIEW });
      questionRepo.findOne.mockResolvedValue(question);
      questionRepo.save.mockResolvedValue(question);
      contentReviewRepo.create.mockImplementation((dto) => dto);
      contentReviewRepo.save.mockResolvedValue(createMockContentReview());

      await service.approveQuestion("question-uuid-1", "admin-uuid-1");
      expect(question.reviewNote).toBeNull();
    });

    it("throws NotFoundException when question not found", async () => {
      questionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.approveQuestion("nonexistent-id", "admin-uuid-1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws BadRequestException when question is not PENDING_REVIEW", async () => {
      const approvedQuestion = createMockQuestion({ contentStatus: ContentStatus.APPROVED });
      questionRepo.findOne.mockResolvedValue(approvedQuestion);

      await expect(
        service.approveQuestion("question-uuid-1", "admin-uuid-1"),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws BadRequestException when question is REJECTED", async () => {
      const rejectedQuestion = createMockQuestion({ contentStatus: ContentStatus.REJECTED });
      questionRepo.findOne.mockResolvedValue(rejectedQuestion);

      await expect(
        service.approveQuestion("question-uuid-1", "admin-uuid-1"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── rejectQuestion ───────────────────────────────────────────────────────

  describe("rejectQuestion", () => {
    it("rejects a pending question and creates a ContentReview record", async () => {
      const question = createMockQuestion({ contentStatus: ContentStatus.PENDING_REVIEW });
      questionRepo.findOne.mockResolvedValue(question);
      questionRepo.save.mockResolvedValue(question);
      contentReviewRepo.create.mockImplementation((dto) => dto);
      contentReviewRepo.save.mockResolvedValue(createMockContentReview());

      const result = await service.rejectQuestion("question-uuid-1", "admin-uuid-1", "Needs improvement");

      expect(question.contentStatus).toBe(ContentStatus.REJECTED);
      expect(question.reviewNote).toBe("Needs improvement");
      expect(contentReviewRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          targetType: ReviewTargetType.QUESTION,
          targetId: "question-uuid-1",
          action: ReviewAction.REJECTED,
          reviewerId: "admin-uuid-1",
          note: "Needs improvement",
        }),
      );
      expect(result).toEqual(question);
    });

    it("throws NotFoundException when question not found", async () => {
      questionRepo.findOne.mockResolvedValue(null);
      await expect(
        service.rejectQuestion("nonexistent-id", "admin-uuid-1", "reason"),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws BadRequestException when question is not PENDING_REVIEW", async () => {
      const approvedQuestion = createMockQuestion({ contentStatus: ContentStatus.APPROVED });
      questionRepo.findOne.mockResolvedValue(approvedQuestion);
      await expect(
        service.rejectQuestion("question-uuid-1", "admin-uuid-1", "reason"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── approveRevision ──────────────────────────────────────────────────────

  describe("approveRevision", () => {
    it("applies revision fields to the question and marks revision APPROVED (within a transaction)", async () => {
      const originalQuestion = createMockQuestion({
        title: "Original title",
        content: "Original content",
        answer: "Original answer",
      });
      const revision = createMockRevision({
        question: originalQuestion,
        title: "Updated title",
        content: "Updated content",
        answer: "Updated answer",
        contentStatus: ContentStatus.PENDING_REVIEW,
      });

      revisionRepo.findOne.mockResolvedValue(revision);
      txQuestionRepo.save.mockResolvedValue(originalQuestion);
      txRevisionRepo.save.mockResolvedValue(revision);

      const result = await service.approveRevision("revision-uuid-1", "admin-uuid-1", "Applied");

      // Transaction was used
      expect(mockDataSource.transaction).toHaveBeenCalled();

      // Question should be updated with revision fields
      expect(originalQuestion.title).toBe("Updated title");
      expect(originalQuestion.content).toBe("Updated content");
      expect(originalQuestion.answer).toBe("Updated answer");
      expect(txQuestionRepo.save).toHaveBeenCalledWith(originalQuestion);

      // Revision should be marked approved
      expect(revision.contentStatus).toBe(ContentStatus.APPROVED);
      expect(revision.reviewedBy).toBe("admin-uuid-1");
      expect(revision.reviewedAt).toBeInstanceOf(Date);
      expect(txRevisionRepo.save).toHaveBeenCalledWith(revision);

      // ContentReview audit record created inside transaction
      expect(txContentReviewRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          targetType: ReviewTargetType.QUESTION_REVISION,
          targetId: "revision-uuid-1",
          action: ReviewAction.APPROVED,
          reviewerId: "admin-uuid-1",
        }),
      );
      expect(result).toEqual(originalQuestion);
    });

    it("preserves original question level when revision level is null", async () => {
      const { QuestionLevel } = require("../database/entities/question.entity");
      const originalQuestion = createMockQuestion({ level: QuestionLevel.SENIOR });
      const revision = createMockRevision({
        question: originalQuestion,
        contentStatus: ContentStatus.PENDING_REVIEW,
      });
      (revision as any).level = null;

      revisionRepo.findOne.mockResolvedValue(revision);
      txQuestionRepo.save.mockResolvedValue(originalQuestion);
      txRevisionRepo.save.mockResolvedValue(revision);

      await service.approveRevision("revision-uuid-1", "admin-uuid-1");

      expect(originalQuestion.level).toBe(QuestionLevel.SENIOR);
    });

    it("preserves original question topicId when revision topicId is null", async () => {
      const originalQuestion = createMockQuestion({ topicId: "original-topic-uuid" });
      const revision = createMockRevision({
        question: originalQuestion,
        contentStatus: ContentStatus.PENDING_REVIEW,
      });
      (revision as any).topicId = null;

      revisionRepo.findOne.mockResolvedValue(revision);
      txQuestionRepo.save.mockResolvedValue(originalQuestion);
      txRevisionRepo.save.mockResolvedValue(revision);

      await service.approveRevision("revision-uuid-1", "admin-uuid-1");

      expect(originalQuestion.topicId).toBe("original-topic-uuid");
    });

    it("throws NotFoundException when revision not found", async () => {
      revisionRepo.findOne.mockResolvedValue(null);
      await expect(
        service.approveRevision("nonexistent-id", "admin-uuid-1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws BadRequestException when revision is not PENDING_REVIEW", async () => {
      const approvedRevision = createMockRevision({ contentStatus: ContentStatus.APPROVED });
      revisionRepo.findOne.mockResolvedValue(approvedRevision);
      await expect(
        service.approveRevision("revision-uuid-1", "admin-uuid-1"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── rejectRevision ───────────────────────────────────────────────────────

  describe("rejectRevision", () => {
    it("rejects a pending revision and creates a ContentReview record", async () => {
      const revision = createMockRevision({ contentStatus: ContentStatus.PENDING_REVIEW });
      revisionRepo.findOne.mockResolvedValue(revision);
      revisionRepo.save.mockResolvedValue(revision);
      contentReviewRepo.create.mockImplementation((dto) => dto);
      contentReviewRepo.save.mockResolvedValue(createMockContentReview());

      const result = await service.rejectRevision("revision-uuid-1", "admin-uuid-1", "Not accurate");

      expect(revision.contentStatus).toBe(ContentStatus.REJECTED);
      expect(revision.reviewedBy).toBe("admin-uuid-1");
      expect(revision.reviewedAt).toBeInstanceOf(Date);
      expect(revision.reviewNote).toBe("Not accurate");
      expect(contentReviewRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          targetType: ReviewTargetType.QUESTION_REVISION,
          action: ReviewAction.REJECTED,
          reviewerId: "admin-uuid-1",
        }),
      );
      expect(result).toEqual(revision);
    });

    it("throws NotFoundException when revision not found", async () => {
      revisionRepo.findOne.mockResolvedValue(null);
      await expect(
        service.rejectRevision("nonexistent-id", "admin-uuid-1", "reason"),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws BadRequestException when revision is not PENDING_REVIEW", async () => {
      const approvedRevision = createMockRevision({ contentStatus: ContentStatus.APPROVED });
      revisionRepo.findOne.mockResolvedValue(approvedRevision);
      await expect(
        service.rejectRevision("revision-uuid-1", "admin-uuid-1", "reason"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── getRevision ──────────────────────────────────────────────────────────

  describe("getRevision", () => {
    it("returns revision when found", async () => {
      const revision = createMockRevision();
      revisionRepo.findOne.mockResolvedValue(revision);

      const result = await service.getRevision("revision-uuid-1");
      expect(result).toEqual(revision);
    });

    it("throws NotFoundException when revision not found", async () => {
      revisionRepo.findOne.mockResolvedValue(null);
      await expect(service.getRevision("nonexistent-id")).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getPendingItems ──────────────────────────────────────────────────────

  describe("getPendingItems", () => {
    it("returns pending questions and revisions", async () => {
      const pendingQuestions = [
        createMockQuestion({ contentStatus: ContentStatus.PENDING_REVIEW }),
      ];
      const pendingRevisions = [
        createMockRevision({ contentStatus: ContentStatus.PENDING_REVIEW }),
      ];
      questionRepo.find.mockResolvedValue(pendingQuestions);
      revisionRepo.find.mockResolvedValue(pendingRevisions);

      const result = await service.getPendingItems();

      expect(result.questions).toEqual(pendingQuestions);
      expect(result.revisions).toEqual(pendingRevisions);
      expect(questionRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { contentStatus: ContentStatus.PENDING_REVIEW },
        }),
      );
    });
  });

  // ─── getPendingCount ──────────────────────────────────────────────────────

  describe("getPendingCount", () => {
    it("returns sum of pending questions and revisions", async () => {
      questionRepo.count.mockResolvedValue(3);
      revisionRepo.count.mockResolvedValue(2);

      const result = await service.getPendingCount();
      expect(result.count).toBe(5);
    });

    it("returns 0 when nothing is pending", async () => {
      questionRepo.count.mockResolvedValue(0);
      revisionRepo.count.mockResolvedValue(0);

      const result = await service.getPendingCount();
      expect(result.count).toBe(0);
    });
  });
});
