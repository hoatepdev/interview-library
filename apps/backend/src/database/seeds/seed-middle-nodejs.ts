/**
 * Seed Script for Middle-Level Node.js Interview Questions
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/database/seeds/seed-middle-nodejs.ts
 *   or: pnpm --filter backend seed:middle-nodejs
 *
 * Adds 20 middle-level Node.js questions.
 * Checks existing questions by title before inserting to avoid duplicates.
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
import { middleNodejsQuestions } from "./interview-data-middle-nodejs";

const topicSlugToId: Record<string, string> = {};

async function runSeed() {
  console.log("🌱 Starting middle-level Node.js questions seed...");

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
    topics.forEach((t: { id: string; slug: string }) => {
      topicSlugToId[t.slug] = t.id;
    });
    console.log(`   Found ${topics.length} topics`);

    // Insert questions (skipping duplicates)
    console.log("❓ Adding middle-level Node.js questions...");
    let added = 0;
    let skipped = 0;

    for (const questionData of middleNodejsQuestions) {
      const topicId = topicSlugToId[questionData.topicSlug];
      if (!topicId) {
        console.warn(
          `⚠️  Topic not found: ${questionData.topicSlug} - skipping question`,
        );
        continue;
      }

      // Check for duplicate by title
      const existing = await dataSource.query(
        `SELECT id FROM questions WHERE title = $1`,
        [questionData.title],
      );
      if (existing.length > 0) {
        skipped++;
        continue;
      }

      const question = questionRepo.create({
        title: questionData.title,
        content: questionData.content,
        answer: questionData.answer,
        topicId: topicId,
        level: questionData.level,
        difficultyScore: 0,
        displayOrder: 0,
      });

      await questionRepo.save(question);
      added++;
    }

    // Summary
    console.log("\n✅ Seed completed successfully!");
    console.log(`\n📊 Summary:`);
    console.log(`   Questions added: ${added}`);
    console.log(`   Questions skipped (duplicates): ${skipped}`);
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
