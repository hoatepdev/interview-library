import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { TranslationService, CreateTopicTranslationDto, UpdateTopicTranslationDto, CreateQuestionTranslationDto, UpdateQuestionTranslationDto } from './translation-crud.service';
import { type Locale } from '@interview-library/shared/i18n';

@Controller('translations')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  // ==================== Topic Translations ====================

  @Get('topics/:topicId')
  getTopicTranslations(@Param('topicId') topicId: string) {
    return this.translationService.getTopicTranslations(topicId);
  }

  @Get('topics/:topicId/:locale')
  getTopicTranslation(@Param('topicId') topicId: string, @Param('locale') locale: Locale) {
    return this.translationService.getTopicTranslation(topicId, locale);
  }

  @Post('topics')
  @UseGuards(ThrottlerGuard)
  @Throttle({ strict: { ttl: 60000, limit: 20 } })
  @HttpCode(HttpStatus.CREATED)
  createTopicTranslation(@Body() dto: CreateTopicTranslationDto) {
    return this.translationService.createTopicTranslation(dto);
  }

  @Put('topics/:topicId/:locale')
  @UseGuards(ThrottlerGuard)
  @Throttle({ strict: { ttl: 60000, limit: 20 } })
  updateTopicTranslation(
    @Param('topicId') topicId: string,
    @Param('locale') locale: Locale,
    @Body() dto: UpdateTopicTranslationDto,
  ) {
    return this.translationService.updateTopicTranslation(topicId, locale, dto);
  }

  @Delete('topics/:topicId/:locale')
  @UseGuards(ThrottlerGuard)
  @Throttle({ strict: { ttl: 60000, limit: 20 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTopicTranslation(@Param('topicId') topicId: string, @Param('locale') locale: Locale) {
    await this.translationService.deleteTopicTranslation(topicId, locale);
  }

  // ==================== Question Translations ====================

  @Get('questions/:questionId')
  getQuestionTranslations(@Param('questionId') questionId: string) {
    return this.translationService.getQuestionTranslations(questionId);
  }

  @Get('questions/:questionId/:locale')
  getQuestionTranslation(@Param('questionId') questionId: string, @Param('locale') locale: Locale) {
    return this.translationService.getQuestionTranslation(questionId, locale);
  }

  @Post('questions')
  @UseGuards(ThrottlerGuard)
  @Throttle({ strict: { ttl: 60000, limit: 20 } })
  @HttpCode(HttpStatus.CREATED)
  createQuestionTranslation(@Body() dto: CreateQuestionTranslationDto) {
    return this.translationService.createQuestionTranslation(dto);
  }

  @Put('questions/:questionId/:locale')
  @UseGuards(ThrottlerGuard)
  @Throttle({ strict: { ttl: 60000, limit: 20 } })
  updateQuestionTranslation(
    @Param('questionId') questionId: string,
    @Param('locale') locale: Locale,
    @Body() dto: UpdateQuestionTranslationDto,
  ) {
    return this.translationService.updateQuestionTranslation(questionId, locale, dto);
  }

  @Delete('questions/:questionId/:locale')
  @UseGuards(ThrottlerGuard)
  @Throttle({ strict: { ttl: 60000, limit: 20 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteQuestionTranslation(@Param('questionId') questionId: string, @Param('locale') locale: Locale) {
    await this.translationService.deleteQuestionTranslation(questionId, locale);
  }

  // ==================== Missing Translations ====================

  @Get('missing/:entityType/:locale')
  getMissingTranslations(@Param('entityType') entityType: 'topics' | 'questions', @Param('locale') locale: Locale) {
    return this.translationService.getMissingTranslations(entityType, locale);
  }
}
