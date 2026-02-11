/**
 * Import translations from JSON file to database
 *
 * Usage:
 *   npm run import:translations [locale] [file]
 *
 * Example:
 *   npm run import:translations vi scripts/translations/vi-questions.json
 */

import { DataSource } from 'typeorm';
import { QuestionTranslation } from '../apps/backend/src/database/entities/question-translation.entity';
import { TopicTranslation } from '../apps/backend/src/database/entities/topic-translation.entity';

interface QuestionTranslationData {
  questionId: string;
  locale: string;
  title: string;
  content: string;
  answer?: string;
}

interface TopicTranslationData {
  topicId: string;
  locale: string;
  name: string;
  description?: string;
}

interface TranslationsFile {
  translations: Array<QuestionTranslationData | TopicTranslationData>;
}

async function importTranslations() {
  const args = process.argv.slice(2);
  const locale = args[0] || 'vi';
  const filePath = args[1] || './scripts/translations/vi-questions.json';

  console.log(`📥 Importing translations for locale: ${locale}`);
  console.log(`📄 File: ${filePath}`);

  // Create database connection
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'interview_library',
    entities: [QuestionTranslation, TopicTranslation],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Connected to database');

    const questionTranslationRepo = dataSource.getRepository(QuestionTranslation);
    const topicTranslationRepo = dataSource.getRepository(TopicTranslation);

    // Read and parse JSON file
    const fs = await import('fs/promises');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data: TranslationsFile = JSON.parse(fileContent);

    console.log(`📊 Found ${data.translations.length} translations to import`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const item of data.translations) {
      try {
        // Check if it's a question or topic translation
        if ('questionId' in item) {
          const translationData = item as QuestionTranslationData;

          // Check if translation already exists
          const existing = await questionTranslationRepo.findOne({
            where: {
              questionId: translationData.questionId,
              locale: translationData.locale as any,
            },
          });

          if (existing) {
            console.log(`⏭️  Skipping existing translation for question ${translationData.questionId}`);
            skipped++;
            continue;
          }

          // Create new translation
          const translation = questionTranslationRepo.create({
            questionId: translationData.questionId,
            locale: translationData.locale as any,
            title: translationData.title,
            content: translationData.content,
            answer: translationData.answer || null,
          });

          await questionTranslationRepo.save(translation);
          console.log(`✅ Imported translation for question: ${translationData.title.substring(0, 50)}...`);
          imported++;

        } else if ('topicId' in item) {
          const translationData = item as TopicTranslationData;

          // Check if translation already exists
          const existing = await topicTranslationRepo.findOne({
            where: {
              topicId: translationData.topicId,
              locale: translationData.locale as any,
            },
          });

          if (existing) {
            console.log(`⏭️  Skipping existing translation for topic ${translationData.topicId}`);
            skipped++;
            continue;
          }

          // Create new translation
          const translation = topicTranslationRepo.create({
            topicId: translationData.topicId,
            locale: translationData.locale as any,
            name: translationData.name,
            description: translationData.description || null,
          });

          await topicTranslationRepo.save(translation);
          console.log(`✅ Imported translation for topic: ${translationData.name}`);
          imported++;
        }

      } catch (error) {
        console.error(`❌ Error importing translation:`, error);
        errors++;
      }
    }

    console.log('\n📈 Import Summary:');
    console.log(`   ✅ Imported: ${imported}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

importTranslations();
