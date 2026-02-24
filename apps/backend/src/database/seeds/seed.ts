/**
 * Seed Script for Interview Library
 *
 * Usage:
 *   npm run seed
 *
 * This script populates the database with sample topics and interview questions.
 */

import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { Topic } from "../entities/topic.entity";
import { Question } from "../entities/question.entity";
import { topics, allQuestions } from "./interview-data";

async function runSeed() {
  console.log("🌱 Starting database seed...");

  // Initialize database connection
  const configService = new ConfigService();
  const dataSource = new DataSource({
    type: "postgres",
    host: configService.get("DB_HOST", "localhost"),
    port: configService.get("DB_PORT", 5432),
    username: configService.get("DB_USERNAME", "postgres"),
    password: configService.get("DB_PASSWORD", "postgres"),
    database: configService.get("DB_NAME", "interview_library"),
    entities: [Topic, Question],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log("✅ Database connected");

    const topicRepo = dataSource.getRepository(Topic);
    const questionRepo = dataSource.getRepository(Question);

    // Check if data already exists
    const existingTopics = await topicRepo.count();
    if (existingTopics > 0) {
      console.log(
        `⚠️  Database already has ${existingTopics} topics. Skipping seed.`,
      );
      console.log("   To re-seed, truncate the tables first:");
      console.log("   TRUNCATE TABLE questions CASCADE;");
      console.log("   TRUNCATE TABLE topics CASCADE;");
      return;
    }

    // Insert topics
    console.log("📚 Creating topics...");
    const createdTopics: Map<string, Topic> = new Map();

    for (const topicData of topics) {
      const topic = topicRepo.create(topicData);
      const saved = await topicRepo.save(topic);
      createdTopics.set(topicData.slug, saved);
      console.log(`   ✓ ${topicData.name}`);
    }

    // Insert questions
    console.log("❓ Creating questions...");
    const questionCounts: Record<string, number> = {};

    for (const questionData of allQuestions) {
      const topic = createdTopics.get(questionData.topicSlug);
      if (!topic) {
        console.warn(`⚠️  Topic not found: ${questionData.topicSlug}`);
        continue;
      }

      const question = questionRepo.create({
        ...questionData,
        topicId: topic.id,
        difficultyScore: 0,
        displayOrder: 0,
      });

      await questionRepo.save(question);

      // Count by topic
      questionCounts[topic.name] = (questionCounts[topic.name] || 0) + 1;
    }

    // Summary
    console.log("\n✅ Seed completed successfully!");
    console.log(`\n📊 Summary:`);
    console.log(`   Topics: ${topics.length}`);
    console.log(`   Questions: ${allQuestions.length}`);
    console.log(`\n   Questions per topic:`);
    Object.entries(questionCounts).forEach(([topic, count]) => {
      console.log(`   - ${topic}: ${count}`);
    });
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log("\n👋 Database connection closed");
  }
}

// Run seed
runSeed().catch((error) => {
  console.error(error);
  process.exit(1);
});
