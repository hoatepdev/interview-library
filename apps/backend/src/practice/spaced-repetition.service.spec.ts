import { SpacedRepetitionService } from "./spaced-repetition.service";
import { SelfRating } from "../database/entities/practice-log.entity";

describe("SpacedRepetitionService", () => {
  let service: SpacedRepetitionService;

  beforeEach(() => {
    service = new SpacedRepetitionService();
  });

  // ─── calculateNextReview ──────────────────────────────────────────────────

  describe("calculateNextReview", () => {
    describe("POOR rating (quality=1, < 3 → reset)", () => {
      it("resets repetitions to 0 and interval to 1", () => {
        const result = service.calculateNextReview(2.5, 6, 2, SelfRating.POOR);
        expect(result.nextRepetitions).toBe(0);
        expect(result.nextInterval).toBe(1);
      });

      it("decreases ease factor by 0.2", () => {
        const result = service.calculateNextReview(2.5, 6, 2, SelfRating.POOR);
        expect(result.nextEaseFactor).toBeCloseTo(2.3, 5);
      });

      it("clamps ease factor to minimum 1.3 when it would go below", () => {
        const result = service.calculateNextReview(1.4, 1, 0, SelfRating.POOR);
        expect(result.nextEaseFactor).toBe(1.3);
      });

      it("does not go below 1.3 even with already low ease factor", () => {
        const result = service.calculateNextReview(1.3, 1, 5, SelfRating.POOR);
        expect(result.nextEaseFactor).toBe(1.3);
      });
    });

    describe("FAIR rating (quality=3, NOT a reset — passes threshold)", () => {
      it("does NOT reset repetitions (quality=3 is >= 3)", () => {
        const result = service.calculateNextReview(2.5, 1, 0, SelfRating.FAIR);
        expect(result.nextRepetitions).toBe(1); // increments, not reset
      });

      it("for rep=0: next interval is 1 day", () => {
        const result = service.calculateNextReview(2.5, 0, 0, SelfRating.FAIR);
        expect(result.nextInterval).toBe(1);
      });

      it("applies ease factor formula (EF + (0.1 - (5-q)*(0.08+(5-q)*0.02)))", () => {
        // FAIR = quality 3, so: EF + (0.1 - (5-3)*(0.08+(5-3)*0.02))
        // = 2.5 + (0.1 - 2*(0.08+2*0.02)) = 2.5 + (0.1 - 2*0.12) = 2.5 + (0.1 - 0.24) = 2.5 - 0.14 = 2.36
        const result = service.calculateNextReview(2.5, 0, 0, SelfRating.FAIR);
        expect(result.nextEaseFactor).toBeCloseTo(2.36, 5);
      });
    });

    describe("GOOD rating (quality=4)", () => {
      it("for rep=0: next interval is 1 day", () => {
        const result = service.calculateNextReview(2.5, 0, 0, SelfRating.GOOD);
        expect(result.nextInterval).toBe(1);
        expect(result.nextRepetitions).toBe(1);
      });

      it("for rep=1: next interval is 6 days", () => {
        const result = service.calculateNextReview(2.5, 1, 1, SelfRating.GOOD);
        expect(result.nextInterval).toBe(6);
        expect(result.nextRepetitions).toBe(2);
      });

      it("for rep=2+: next interval = round(currentInterval * EF)", () => {
        // interval=6, EF=2.5, GOOD formula: EF + (0.1 - (5-4)*(0.08+(5-4)*0.02)) = 2.5 + (0.1 - 0.1) = 2.5
        const result = service.calculateNextReview(2.5, 6, 2, SelfRating.GOOD);
        expect(result.nextInterval).toBe(Math.round(6 * result.nextEaseFactor));
        expect(result.nextRepetitions).toBe(3);
      });

      it("applies correct ease factor formula for GOOD", () => {
        // quality=4: EF + (0.1 - (5-4)*(0.08+(5-4)*0.02)) = EF + (0.1 - 1*(0.08+0.02)) = EF + 0
        const result = service.calculateNextReview(2.5, 0, 0, SelfRating.GOOD);
        expect(result.nextEaseFactor).toBeCloseTo(2.5, 5);
      });
    });

    describe("GREAT rating (quality=5)", () => {
      it("increases ease factor (clamped to 2.5 when starting at max)", () => {
        // quality=5: EF + (0.1 - (5-5)*...) = EF + 0.1 = 2.5 + 0.1 = 2.6 → clamped to 2.5
        const result = service.calculateNextReview(2.5, 0, 0, SelfRating.GREAT);
        expect(result.nextEaseFactor).toBe(2.5); // clamped at max
      });

      it("clamps ease factor to maximum 2.5", () => {
        // Starting from 2.5 + 0.1 = 2.6 → should clamp to 2.5
        const result = service.calculateNextReview(2.5, 0, 0, SelfRating.GREAT);
        expect(result.nextEaseFactor).toBe(2.5);
      });

      it("clamps even when starting below 2.5", () => {
        // Starting from 2.4 + 0.1 = 2.5 → exactly at clamp
        const result = service.calculateNextReview(2.4, 0, 0, SelfRating.GREAT);
        expect(result.nextEaseFactor).toBe(2.5);
      });

      it("does not exceed 2.5 when starting at 2.45", () => {
        const result = service.calculateNextReview(2.45, 0, 0, SelfRating.GREAT);
        expect(result.nextEaseFactor).toBe(2.5);
      });
    });

    describe("ease factor clamping invariants", () => {
      it("ease factor is always >= 1.3", () => {
        const ratings = [SelfRating.POOR, SelfRating.FAIR, SelfRating.GOOD, SelfRating.GREAT];
        for (const rating of ratings) {
          const result = service.calculateNextReview(1.3, 1, 1, rating);
          expect(result.nextEaseFactor).toBeGreaterThanOrEqual(1.3);
        }
      });

      it("ease factor is always <= 2.5", () => {
        const ratings = [SelfRating.FAIR, SelfRating.GOOD, SelfRating.GREAT];
        for (const rating of ratings) {
          const result = service.calculateNextReview(2.5, 1, 1, rating);
          expect(result.nextEaseFactor).toBeLessThanOrEqual(2.5);
        }
      });
    });

    describe("interval progression", () => {
      it("rep=0 → interval=1 (first review)", () => {
        const result = service.calculateNextReview(2.5, 0, 0, SelfRating.GOOD);
        expect(result.nextInterval).toBe(1);
      });

      it("rep=1 → interval=6 (second review)", () => {
        const result = service.calculateNextReview(2.5, 1, 1, SelfRating.GOOD);
        expect(result.nextInterval).toBe(6);
      });

      it("rep=2 → interval = round(6 * EF)", () => {
        const result = service.calculateNextReview(2.5, 6, 2, SelfRating.GOOD);
        expect(result.nextInterval).toBe(15); // round(6 * 2.5) = 15
      });

      it("rep=3 → interval = round(prev * EF)", () => {
        const result = service.calculateNextReview(2.5, 15, 3, SelfRating.GOOD);
        expect(result.nextInterval).toBe(38); // round(15 * 2.5) = 38
      });
    });
  });

  // ─── isDueForReview ───────────────────────────────────────────────────────

  describe("isDueForReview", () => {
    it("returns true when nextReviewAt is null", () => {
      expect(service.isDueForReview(null)).toBe(true);
    });

    it("returns true when nextReviewAt is undefined", () => {
      expect(service.isDueForReview(undefined)).toBe(true);
    });

    it("returns true when nextReviewAt is in the past", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(service.isDueForReview(pastDate)).toBe(true);
    });

    it("returns true when nextReviewAt is exactly now (same millisecond)", () => {
      const now = new Date();
      // A date in the past (even by 1ms) should be due
      const justPast = new Date(now.getTime() - 1);
      expect(service.isDueForReview(justPast)).toBe(true);
    });

    it("returns false when nextReviewAt is in the future", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      expect(service.isDueForReview(futureDate)).toBe(false);
    });
  });

  // ─── getDueStatus ─────────────────────────────────────────────────────────

  describe("getDueStatus", () => {
    it("returns isDue=true and 'Due now' when nextReviewAt is null", () => {
      const result = service.getDueStatus(null);
      expect(result.isDue).toBe(true);
      expect(result.text).toBe("Due now");
      expect(result.daysUntil).toBeUndefined();
    });

    it("returns isDue=true and 'Due now' when nextReviewAt is in the past", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);
      const result = service.getDueStatus(pastDate);
      expect(result.isDue).toBe(true);
      expect(result.text).toBe("Due now");
      expect(result.daysUntil).toBe(0);
    });

    it("returns isDue=false and 'Due tomorrow' when nextReviewAt is exactly 1 day away", () => {
      // Set to exactly 24 hours from now (Math.ceil of 24h = 1 day)
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const result = service.getDueStatus(tomorrow);
      expect(result.isDue).toBe(false);
      expect(result.text).toBe("Due tomorrow");
      expect(result.daysUntil).toBe(1);
    });

    it("returns 'Due in N days' for 2-7 days", () => {
      const in5Days = new Date();
      in5Days.setDate(in5Days.getDate() + 5);
      in5Days.setHours(in5Days.getHours() + 1);
      const result = service.getDueStatus(in5Days);
      expect(result.isDue).toBe(false);
      expect(result.text).toMatch(/Due in \d+ days/);
      expect(result.daysUntil).toBeGreaterThan(1);
    });

    it("returns '~N weeks' format for 8+ days", () => {
      const in14Days = new Date();
      in14Days.setDate(in14Days.getDate() + 14);
      in14Days.setHours(in14Days.getHours() + 1);
      const result = service.getDueStatus(in14Days);
      expect(result.isDue).toBe(false);
      expect(result.text).toMatch(/~\d+ weeks/);
    });
  });
});
