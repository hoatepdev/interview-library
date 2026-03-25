/**
 * Master Seed Script for ALL Senior-Level Interview Questions
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/database/seeds/seed-senior-all.ts
 *   or: pnpm --filter backend seed:senior-all
 *
 * Adds 10 senior-level questions per topic across all 11 topics (110 questions total).
 * Checks existing questions by title before inserting to avoid duplicates.
 * Runs all topics in a single database connection for efficiency.
 */

import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { Question } from "../entities/question.entity";
import { QuestionTranslation } from "../entities/question-translation.entity";
import { QuestionRevision } from "../entities/question-revision.entity";
import { Topic } from "../entities/topic.entity";
import { TopicTranslation } from "../entities/topic-translation.entity";
import { User } from "../entities/user.entity";
import { UserQuestion } from "../entities/user-question.entity";
import { PracticeLog } from "../entities/practice-log.entity";
import { ContentReview } from "../entities/content-review.entity";
import { DomainEvent } from "../entities/domain-event.entity";

import { seniorSystemDesignQuestions } from "./interview-data-senior-system-design";
import { seniorPostgresqlQuestions } from "./interview-data-senior-postgresql";
import { seniorNodejsQuestions } from "./interview-data-senior-nodejs";
import { seniorNestjsQuestions } from "./interview-data-senior-nestjs";
import { seniorDockerDevopsQuestions } from "./interview-data-senior-docker-devops";
import { seniorNextjsQuestions } from "./interview-data-senior-nextjs";
import { seniorReactQuestions } from "./interview-data-senior-react";
import { seniorTypescriptQuestions } from "./interview-data-senior-typescript";
import { seniorJavascriptQuestions } from "./interview-data-senior-javascript";
import { seniorTestingQuestions } from "./interview-data-senior-testing";
import { seniorGitQuestions } from "./interview-data-senior-git";

const ALL_SENIOR_QUESTIONS = [
  ...seniorSystemDesignQuestions,
  ...seniorPostgresqlQuestions,
  ...seniorNodejsQuestions,
  ...seniorNestjsQuestions,
  ...seniorDockerDevopsQuestions,
  ...seniorNextjsQuestions,
  ...seniorReactQuestions,
  ...seniorTypescriptQuestions,
  ...seniorJavascriptQuestions,
  ...seniorTestingQuestions,
  ...seniorGitQuestions,
];

async function runSeed() {
  console.log("🌱 Starting senior-level questions seed (ALL topics)...");
  console.log(`   Total questions to process: ${ALL_SENIOR_QUESTIONS.length}`);

  const configService = new ConfigService();
  const dataSource = new DataSource({
    type: "postgres",
    host: configService.get("DB_HOST", "localhost"),
    port: configService.get("DB_PORT", 5432),
    username: configService.get("DB_USERNAME", "postgres"),
    password: configService.get("DB_PASSWORD", "postgres"),
    database: configService.get("DB_NAME", "interview_library"),
    entities: [
      Question,
      QuestionTranslation,
      QuestionRevision,
      Topic,
      TopicTranslation,
      User,
      UserQuestion,
      PracticeLog,
      ContentReview,
      DomainEvent,
    ],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log("✅ Database connected");

    const questionRepo = dataSource.getRepository(Question);

    // Build topic slug -> id map
    console.log("📚 Fetching topics...");
    const topics = await dataSource.query(`SELECT id, slug FROM topics`);
    const topicSlugToId: Record<string, string> = {};
    topics.forEach((t: { id: string; slug: string }) => {
      topicSlugToId[t.slug] = t.id;
    });
    console.log(`   Found ${topics.length} topics`);

    // Track per-topic stats
    const topicStats: Record<string, { added: number; skipped: number }> = {};

    let totalAdded = 0;
    let totalSkipped = 0;

    for (const questionData of ALL_SENIOR_QUESTIONS) {
      const topicId = topicSlugToId[questionData.topicSlug];
      if (!topicId) {
        console.warn(
          `⚠️  Topic not found: ${questionData.topicSlug} - skipping question`,
        );
        continue;
      }

      if (!topicStats[questionData.topicSlug]) {
        topicStats[questionData.topicSlug] = { added: 0, skipped: 0 };
      }

      // Check for duplicate by title
      const existing = await dataSource.query(
        `SELECT id FROM questions WHERE title = $1`,
        [questionData.title],
      );
      if (existing.length > 0) {
        topicStats[questionData.topicSlug].skipped++;
        totalSkipped++;
        continue;
      }

      const question = questionRepo.create({
        title: questionData.title,
        answer: questionData.answer,
        topicId: topicId,
        level: questionData.level,
        difficultyScore: questionData.difficultyScore,
        displayOrder: questionData.displayOrder,
      });

      await questionRepo.save(question);
      topicStats[questionData.topicSlug].added++;
      totalAdded++;
    }

    // Summary
    console.log("\n✅ Seed completed successfully!");
    console.log(`\n📊 Summary per topic:`);
    for (const [slug, stats] of Object.entries(topicStats)) {
      const addedStr = stats.added > 0 ? `+${stats.added}` : "0";
      const skipStr = stats.skipped > 0 ? ` (${stats.skipped} skipped)` : "";
      console.log(`   ${slug.padEnd(16)}: ${addedStr}${skipStr}`);
    }
    console.log(`\n   Total added:   ${totalAdded}`);
    console.log(`   Total skipped: ${totalSkipped}`);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log("\n👋 Database connection closed");
  }
}

runSeed().catch((error) => {
  console.error(error);
  process.exit(1);
});
