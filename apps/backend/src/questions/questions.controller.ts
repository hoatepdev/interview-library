import { Controller, Get, Post, Put, Delete, Body, Param, Patch, Query, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { Request } from 'express';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { UpdateQuestionStatusDto } from './dto/update-question-status.dto';
import { QueryQuestionsDto } from './dto/query-questions.dto';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(createQuestionDto);
  }

  @Get()
  findAll(@Req() req: Request, @Query() query: QueryQuestionsDto) {
    const lang = req.i18n?.lang || 'en';
    return this.questionsService.findAll(query, lang);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const lang = req.i18n?.lang || 'en';
    return this.questionsService.findOne(id, lang);
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
  toggleFavorite(@Param('id') id: string) {
    return this.questionsService.toggleFavorite(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.questionsService.remove(id);
  }
}
