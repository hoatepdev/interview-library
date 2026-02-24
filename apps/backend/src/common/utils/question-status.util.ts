/**
 * QuestionStatus is now derived from per-user SM-2 state in user_questions.
 * The enum remains for API contract compatibility, but is no longer stored
 * on the questions table.
 */
export enum QuestionStatus {
  NEW = "new",
  LEARNING = "learning",
  MASTERED = "mastered",
}

/**
 * Derive the learning status from a user's SM-2 repetition count.
 *
 * - repetitions = 0          -> NEW        (never practiced or reset)
 * - repetitions between 1-3  -> LEARNING   (actively being learned)
 * - repetitions >= 4         -> MASTERED   (well-retained)
 */
export function getQuestionStatus(repetitions: number): QuestionStatus {
  if (repetitions >= 4) return QuestionStatus.MASTERED;
  if (repetitions >= 1) return QuestionStatus.LEARNING;
  return QuestionStatus.NEW;
}
