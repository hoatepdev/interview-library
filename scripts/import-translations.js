/**
 * Import translations from JSON file to database (Simple SQL version)
 *
 * Usage:
 *   node scripts/import-translations.js [file]
 *
 * Example:
 *   node scripts/import-translations.js scripts/translations/vi-questions.json
 */

const { Client } = require('pg');
const fs = require('fs/promises');

async function importTranslations() {
  const args = process.argv.slice(2);
  const filePath = args[0] || './scripts/translations/vi-questions.json';

  console.log(`📥 Importing translations from: ${filePath}`);

  // Create database connection
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'interview_library',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read and parse JSON file
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    console.log(`📊 Found ${data.translations.length} translations to import`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const item of data.translations) {
      try {
        // Check if it's a question or topic translation
        if ('questionId' in item) {
          const { questionId, locale, title, content, answer } = item;

          // Check if translation already exists
          const checkResult = await client.query(
            'SELECT id FROM question_translations WHERE question_id = $1 AND locale = $2',
            [questionId, locale]
          );

          if (checkResult.rows.length > 0) {
            console.log(`⏭️  Skipping existing translation for question ${questionId}`);
            skipped++;
            continue;
          }

          // Insert new translation
          await client.query(
            `INSERT INTO question_translations (question_id, locale, title, content, answer, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
            [questionId, locale, title, content, answer || null]
          );

          console.log(`✅ Imported: ${title.substring(0, 50)}...`);
          imported++;

        } else if ('topicId' in item) {
          const { topicId, locale, name, description } = item;

          // Check if translation already exists
          const checkResult = await client.query(
            'SELECT id FROM topic_translations WHERE topic_id = $1 AND locale = $2',
            [topicId, locale]
          );

          if (checkResult.rows.length > 0) {
            console.log(`⏭️  Skipping existing translation for topic ${topicId}`);
            skipped++;
            continue;
          }

          // Insert new translation
          await client.query(
            `INSERT INTO topic_translations (topic_id, locale, name, description, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())`,
            [topicId, locale, name, description || null]
          );

          console.log(`✅ Imported topic: ${name}`);
          imported++;
        }

      } catch (error) {
        console.error(`❌ Error importing translation:`, error.message);
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
    await client.end();
  }
}

importTranslations();
