/**
 * Seed Script for Additional Interview Questions
 *
 * Usage:
 *   npm run seed:additional
 *
 * This script adds NEW interview questions without duplicating existing ones.
 * It checks existing questions by title before inserting.
 */

import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
// Import all entities to avoid metadata errors
import { Question } from '../entities/question.entity';
import { QuestionTranslation } from '../entities/question-translation.entity';
import { QuestionFavorite } from '../entities/question-favorite.entity';
import { Topic } from '../entities/topic.entity';
import { TopicTranslation } from '../entities/topic-translation.entity';
import { User } from '../entities/user.entity';
import { UserQuestion } from '../entities/user-question.entity';
import { PracticeLog } from '../entities/practice-log.entity';
import { additionalQuestions } from './interview-data-additional';

// Topic slug to ID mapping (will be fetched from DB)
const topicSlugToId: Record<string, string> = {};

async function getTopicIdBySlug(dataSource: DataSource, slug: string): Promise<string | null> {
  if (topicSlugToId[slug]) {
    return topicSlugToId[slug];
  }

  const result = await dataSource.query(
    `SELECT id FROM topics WHERE slug = $1`,
    [slug]
  );

  if (result.length === 0) {
    return null;
  }

  topicSlugToId[slug] = result[0].id;
  return result[0].id;
}

async function questionExists(dataSource: DataSource, title: string): Promise<boolean> {
  const result = await dataSource.query(
    `SELECT id FROM questions WHERE title = $1`,
    [title]
  );
  return result.length > 0;
}

async function runSeed() {
  console.log('🌱 Starting additional questions seed...');

  const configService = new ConfigService();
  const dataSource = new DataSource({
    type: 'postgres',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get('DB_PORT', 5432),
    username: configService.get('DB_USERNAME', 'postgres'),
    password: configService.get('DB_PASSWORD', 'postgres'),
    database: configService.get('DB_NAME', 'interview_library'),
    entities: [
      Question,
      QuestionTranslation,
      QuestionFavorite,
      Topic,
      TopicTranslation,
      User,
      UserQuestion,
      PracticeLog,
    ],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected');

    const questionRepo = dataSource.getRepository(Question);

    // Get all topics and build slug->id map
    console.log('📚 Fetching topics...');
    const topics = await dataSource.query(`SELECT id, slug FROM topics`);
    topics.forEach((t: { id: string; slug: string }) => {
      topicSlugToId[t.slug] = t.id;
    });
    console.log(`   Found ${topics.length} topics`);

    // Insert questions (skipping duplicates)
    console.log('❓ Adding new questions...');
    let added = 0;
    let skipped = 0;
    const questionCounts: Record<string, number> = {};

    for (const questionData of additionalQuestions) {
      // Check if topic exists
      const topicId = await getTopicIdBySlug(dataSource, questionData.topicSlug);
      if (!topicId) {
        console.warn(`⚠️  Topic not found: ${questionData.topicSlug} - skipping question`);
        continue;
      }

      // Check for duplicate by title
      const exists = await questionExists(dataSource, questionData.title);
      if (exists) {
        skipped++;
        continue;
      }

      const question = questionRepo.create({
        title: questionData.title,
        content: questionData.content,
        answer: questionData.answer,
        topicId: topicId,
        level: questionData.level,
        status: 'new' as any,
        difficultyScore: 0,
        practiceCount: 0,
        order: 0,
      });

      await questionRepo.save(question);

      // Count by topic
      const topicName = Object.keys(topicSlugToId).find(slug => topicSlugToId[slug] === topicId) || questionData.topicSlug;
      questionCounts[topicName] = (questionCounts[topicName] || 0) + 1;
      added++;
    }

    // Summary
    console.log('\n✅ Seed completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   Questions added: ${added}`);
    console.log(`   Questions skipped (duplicates): ${skipped}`);
    console.log(`\n   Questions per topic:`);
    Object.entries(questionCounts).forEach(([topic, count]) => {
      console.log(`   - ${topic}: +${count}`);
    });

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('\n👋 Database connection closed');
  }
}

// Run seed
runSeed().catch((error) => {
  console.error(error);
  process.exit(1);
});
