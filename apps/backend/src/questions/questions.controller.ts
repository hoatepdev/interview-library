import { Controller, Get, Post, Put, Delete, Body, Param, Patch, Query, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { UpdateQuestionStatusDto } from './dto/update-question-status.dto';
import { QueryQuestionsDto } from './dto/query-questions.dto';
import { User } from '../database/entities/user.entity';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';

interface AuthenticatedRequest extends Request {
  user?: User;
}

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: AuthenticatedRequest, @Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(createQuestionDto);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest, @Query() query: QueryQuestionsDto) {
    const lang = req.i18n?.lang || 'en';
    const userId = req.user?.id;
    return this.questionsService.findAll(query, lang, userId);
  }

  @Get('by-topic-slug/:slug')
  getByTopicSlug(@Param('slug') slug: string, @Query() query: QueryQuestionsDto, @Req() req: AuthenticatedRequest) {
    const lang = req.i18n?.lang || 'en';
    const userId = req.user?.id;
    return this.questionsService.getByTopicSlug(slug, query, lang, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const lang = req.i18n?.lang || 'en';
    const userId = req.user?.id;
    return this.questionsService.findOne(id, lang, userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateQuestionDto: UpdateQuestionDto) {
    return this.questionsService.update(id, updateQuestionDto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateQuestionStatusDto) {
    return this.questionsService.updateStatus(id, updateStatusDto);
  }

  @Patch(':id/favorite')
  toggleFavorite(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('User must be authenticated to favorite questions');
    }
    return this.questionsService.toggleFavorite(id, userId);
  }

  @Delete(':id')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.questionsService.remove(id, req.user?.id);
  }
}
