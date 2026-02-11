const fs = require('fs');
const path = require('path');

const locales = ['en', 'vi'];
const messagesDir = path.join(__dirname, '../apps/frontend/src/messages');

function flattenKeys(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, key) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      return [...acc, ...flattenKeys(obj[key], fullKey)];
    }
    return [...acc, fullKey];
  }, []);
}

const translations = {};
for (const locale of locales) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  translations[locale] = flattenKeys(JSON.parse(fs.readFileSync(filePath, 'utf8')));
}

// Check for missing keys
const baseKeys = new Set(translations['en']);
let hasErrors = false;

for (const locale of locales.filter(l => l !== 'en')) {
  const localeKeys = new Set(translations[locale]);

  const missing = [...baseKeys].filter(k => !localeKeys.has(k));
  const extra = [...localeKeys].filter(k => !baseKeys.has(k));

  if (missing.length > 0) {
    console.error(`❌ Missing keys in ${locale}:`, missing);
    hasErrors = true;
  }

  if (extra.length > 0) {
    console.warn(`⚠️  Extra keys in ${locale}:`, extra);
  }
}

if (!hasErrors) {
  console.log('✅ All translation keys are synchronized!');
  process.exit(0);
} else {
  process.exit(1);
}
