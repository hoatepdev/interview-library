/**
 * Seed Script for Middle-Level Testing Interview Questions
 *
 * Usage: pnpm --filter backend seed:middle-testing
 *
 * Creates the "testing" topic if it doesn't exist,
 * then adds 20 middle-level questions.
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
import {
  middleTestingQuestions,
  newTopic,
} from "./interview-data-middle-testing";

async function runSeed() {
  console.log("🌱 Starting middle-level Testing questions seed...");

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

    const topicRepo = dataSource.getRepository(Topic);
    const questionRepo = dataSource.getRepository(Question);

    // Create topic if it doesn't exist
    console.log("📚 Ensuring topic exists...");
    let topic = await topicRepo.findOne({ where: { slug: newTopic.slug } });
    if (!topic) {
      topic = topicRepo.create(newTopic);
      topic = await topicRepo.save(topic);
      console.log(`   ✓ Created topic: ${newTopic.name}`);
    } else {
      console.log(`   ℹ Topic already exists: ${newTopic.name}`);
    }

    // Build topic slug -> id map
    const topicSlugToId: Record<string, string> = {};
    const topics = await dataSource.query(`SELECT id, slug FROM topics`);
    topics.forEach((t: { id: string; slug: string }) => {
      topicSlugToId[t.slug] = t.id;
    });

    // Insert questions (skipping duplicates)
    console.log("❓ Adding middle-level Testing questions...");
    let added = 0;
    let skipped = 0;

    for (const questionData of middleTestingQuestions) {
      const topicId = topicSlugToId[questionData.topicSlug];
      if (!topicId) {
        console.warn(
          `⚠️  Topic not found: ${questionData.topicSlug} - skipping question`,
        );
        continue;
      }

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
