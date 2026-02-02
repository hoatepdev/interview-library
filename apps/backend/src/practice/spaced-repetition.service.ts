import { Injectable } from '@nestjs/common';
import { SelfRating } from '../database/entities/practice-log.entity';

/**
 * SM-2 Spaced Repetition Algorithm
 * Based on SuperMemo 2 algorithm
 */
@Injectable()
export class SpacedRepetitionService {
  /**
   * Calculate next review date based on SM-2 algorithm
   * @param currentEaseFactor Current ease factor (1.3 - 2.5)
   * @param interval Current interval in days
   * @param repetitions Number of successful repetitions
   * @param rating Quality of response (0-5), mapped from our SelfRating
   * @returns Object with next interval and ease factor
   */
  calculateNextReview(
    currentEaseFactor: number = 2.5,
    interval: number = 0,
    repetitions: number = 0,
    rating: SelfRating,
  ): {
    nextInterval: number;
    nextEaseFactor: number;
    nextRepetitions: number;
  } {
    // Map SelfRating to SM-2 quality (0-5 scale)
    const quality = this.mapRatingToQuality(rating);

    // If rating is below 3 (poor/fair), reset and start over
    if (quality < 3) {
      return {
        nextInterval: 1, // Review again tomorrow
        nextEaseFactor: Math.max(1.3, currentEaseFactor - 0.2), // Decrease ease factor
        nextRepetitions: 0, // Reset repetitions
      };
    }

    // Calculate new ease factor
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    const nextEaseFactor = currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    const clampedEaseFactor = Math.max(1.3, Math.min(2.5, nextEaseFactor));

    // Calculate next interval
    let nextInterval: number;

    if (repetitions === 0) {
      nextInterval = 1; // First review: 1 day
    } else if (repetitions === 1) {
      nextInterval = 6; // Second review: 6 days
    } else {
      // Subsequent reviews: I(n) = I(n-1) * EF
      nextInterval = Math.round(interval * clampedEaseFactor);
    }

    return {
      nextInterval,
      nextEaseFactor: clampedEaseFactor,
      nextRepetitions: repetitions + 1,
    };
  }

  /**
   * Map our 4-point scale to SM-2 quality (0-5)
   */
  private mapRatingToQuality(rating: SelfRating): number {
    switch (rating) {
      case SelfRating.POOR:
        return 1; // Poor recall
      case SelfRating.FAIR:
        return 3; // Hard recall
      case SelfRating.GOOD:
        return 4; // Good recall
      case SelfRating.GREAT:
        return 5; // Perfect recall
      default:
        return 3;
    }
  }

  /**
   * Calculate the initial review date for a new question
   */
  getInitialReviewDate(): Date {
    // New questions should be reviewed within 1 day
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
  }

  /**
   * Check if a question is due for review
   */
  isDueForReview(nextReviewAt: Date | null | undefined): boolean {
    if (!nextReviewAt) {
      return true; // No review date set, so it's due
    }
    return new Date(nextReviewAt) <= new Date();
  }

  /**
   * Get human-readable due date string
   */
  getDueStatus(nextReviewAt: Date | null | undefined): {
    isDue: boolean;
    text: string;
    daysUntil?: number;
  } {
    if (!nextReviewAt) {
      return {
        isDue: true,
        text: 'Due now',
      };
    }

    const now = new Date();
    const dueDate = new Date(nextReviewAt);
    const diffMs = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return {
        isDue: true,
        text: 'Due now',
        daysUntil: 0,
      };
    }

    if (diffDays === 1) {
      return {
        isDue: false,
        text: 'Due tomorrow',
        daysUntil: 1,
      };
    }

    if (diffDays <= 7) {
      return {
        isDue: false,
        text: `Due in ${diffDays} days`,
        daysUntil: diffDays,
      };
    }

    const weeks = Math.ceil(diffDays / 7);
    return {
      isDue: false,
      text: `Due in ~${weeks} weeks`,
      daysUntil: diffDays,
    };
  }
}
