import { Injectable } from "@nestjs/common";
import { Topic } from "../database/entities/topic.entity";
import { Question } from "../database/entities/question.entity";
import { TopicTranslation } from "../database/entities/topic-translation.entity";
import { QuestionTranslation } from "../database/entities/question-translation.entity";
import {
  DEFAULT_LOCALE,
  LOCALES,
  isValidLocale,
  type Locale,
  type TranslationResponse,
} from "@interview-library/shared/i18n";

/**
 * Service for handling translations with fallback logic
 */
@Injectable()
export class TranslationService {
  /**
   * Check if a locale is supported
   */
  isLocaleSupported(locale: string): locale is Locale {
    return isValidLocale(locale);
  }

  /**
   * Validate locale or return default
   */
  validateLocale(locale?: string): Locale {
    if (!locale) return DEFAULT_LOCALE;
    if (this.isLocaleSupported(locale)) return locale as Locale;
    return DEFAULT_LOCALE;
  }

  /**
   * Get available locales for a topic
   */
  getTopicAvailableLocales(topic: Topic): Locale[] {
    const locales: Locale[] = ["en"]; // English is always available
    if (topic.translations && topic.translations.length > 0) {
      topic.translations.forEach((t) => {
        if (!locales.includes(t.locale)) {
          locales.push(t.locale);
        }
      });
    }
    return locales;
  }

  /**
   * Get available locales for a question
   */
  getQuestionAvailableLocales(question: Question): Locale[] {
    const locales: Locale[] = ["en"]; // English is always available
    if (question.translations && question.translations.length > 0) {
      question.translations.forEach((t) => {
        if (!locales.includes(t.locale)) {
          locales.push(t.locale);
        }
      });
    }
    return locales;
  }

  /**
   * Find translation for a topic
   */
  findTopicTranslation(
    topic: Topic,
    locale: Locale,
  ): TopicTranslation | undefined {
    return topic.translations?.find((t) => t.locale === locale);
  }

  /**
   * Find translation for a question
   */
  findQuestionTranslation(
    question: Question,
    locale: Locale,
  ): QuestionTranslation | undefined {
    return question.translations?.find((t) => t.locale === locale);
  }

  /**
   * Get translated name for a topic with fallback
   */
  getTopicName(topic: Topic, locale: Locale): string {
    if (locale === DEFAULT_LOCALE) return topic.name;
    const translation = this.findTopicTranslation(topic, locale);
    return translation?.name || topic.name;
  }

  /**
   * Get translated description for a topic with fallback
   */
  getTopicDescription(topic: Topic, locale: Locale): string | null {
    if (locale === DEFAULT_LOCALE) return topic.description || null;
    const translation = this.findTopicTranslation(topic, locale);
    return translation?.description ?? topic.description ?? null;
  }

  /**
   * Get translated title for a question with fallback
   */
  getQuestionTitle(question: Question, locale: Locale): string {
    if (locale === DEFAULT_LOCALE) return question.title;
    const translation = this.findQuestionTranslation(question, locale);
    return translation?.title || question.title;
  }

  /**
   * Get translated content for a question with fallback
   */
  getQuestionContent(question: Question, locale: Locale): string {
    if (locale === DEFAULT_LOCALE) return question.content;
    const translation = this.findQuestionTranslation(question, locale);
    return translation?.content || question.content;
  }

  /**
   * Get translated answer for a question with fallback
   */
  getQuestionAnswer(question: Question, locale: Locale): string | null {
    if (locale === DEFAULT_LOCALE) return question.answer || null;
    const translation = this.findQuestionTranslation(question, locale);
    return translation?.answer ?? question.answer ?? null;
  }

  /**
   * Format topic with translations for API response
   */
  formatTopic<T extends Topic>(
    topic: T,
    locale: Locale = DEFAULT_LOCALE,
  ): TranslationResponse {
    const validatedLocale = this.validateLocale(locale);
    const translation = this.findTopicTranslation(topic, validatedLocale);
    const availableLocales = this.getTopicAvailableLocales(topic);

    // Check if any field used fallback
    const isFallback =
      validatedLocale === DEFAULT_LOCALE
        ? false
        : {
            name: !translation?.name,
            description:
              translation?.description === undefined && !!topic.description,
          };

    // For single field fallback, return boolean instead of object
    const finalIsFallback =
      validatedLocale === DEFAULT_LOCALE
        ? false
        : !translation ||
            Object.keys(isFallback as Record<string, boolean>).some(
              (k) => !(isFallback as Record<string, boolean>)[k],
            )
          ? false
          : isFallback;

    return {
      id: topic.id,
      locale: translation ? validatedLocale : DEFAULT_LOCALE,
      isFallback: finalIsFallback,
      availableLocales,
      data: {
        id: topic.id,
        slug: topic.slug,
        color: topic.color,
        icon: topic.icon,
        name: this.getTopicName(topic, validatedLocale),
        description: this.getTopicDescription(topic, validatedLocale),
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
      },
    };
  }

  /**
   * Format question with translations for API response
   */
  formatQuestion<T extends Question>(
    question: T,
    locale: Locale = DEFAULT_LOCALE,
    includeTopic = false,
  ): TranslationResponse {
    const validatedLocale = this.validateLocale(locale);
    const translation = this.findQuestionTranslation(question, validatedLocale);
    const availableLocales = this.getQuestionAvailableLocales(question);

    // Check which fields used fallback
    const isFallback =
      validatedLocale === DEFAULT_LOCALE
        ? false
        : {
            title: !translation?.title,
            content: !translation?.content,
            answer: translation?.answer === undefined && !!question.answer,
          };

    // For single field fallback, return boolean instead of object
    const finalIsFallback =
      validatedLocale === DEFAULT_LOCALE
        ? false
        : !translation ||
            Object.keys(isFallback as Record<string, boolean>).some(
              (k) => !(isFallback as Record<string, boolean>)[k],
            )
          ? false
          : isFallback;

    const data: any = {
      id: question.id,
      title: this.getQuestionTitle(question, validatedLocale),
      content: this.getQuestionContent(question, validatedLocale),
      answer: this.getQuestionAnswer(question, validatedLocale),
      topicId: question.topicId,
      level: question.level,
      difficultyScore: question.difficultyScore,
      displayOrder: question.displayOrder,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };

    if (includeTopic && question.topic) {
      data.topic = this.formatTopic(question.topic, validatedLocale).data;
    }

    return {
      id: question.id,
      locale: translation ? validatedLocale : DEFAULT_LOCALE,
      isFallback: finalIsFallback,
      availableLocales,
      data,
    };
  }

  /**
   * Format multiple topics
   */
  formatTopics<T extends Topic>(
    topics: T[],
    locale: Locale = DEFAULT_LOCALE,
  ): TranslationResponse[] {
    return topics.map((topic) => this.formatTopic(topic, locale));
  }

  /**
   * Format multiple questions
   */
  formatQuestions<T extends Question>(
    questions: T[],
    locale: Locale = DEFAULT_LOCALE,
    includeTopic = false,
  ): TranslationResponse[] {
    return questions.map((question) =>
      this.formatQuestion(question, locale, includeTopic),
    );
  }

  /**
   * Check if topic is missing translation for locale
   */
  isTopicMissingTranslation(topic: Topic, locale: Locale): boolean {
    if (locale === DEFAULT_LOCALE) return false;
    return !this.findTopicTranslation(topic, locale);
  }

  /**
   * Check if question is missing translation for locale
   */
  isQuestionMissingTranslation(question: Question, locale: Locale): boolean {
    if (locale === DEFAULT_LOCALE) return false;
    return !this.findQuestionTranslation(question, locale);
  }
}
