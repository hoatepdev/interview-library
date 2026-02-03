import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';

@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTopicDto: CreateTopicDto) {
    return this.topicsService.create(createTopicDto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const lang = req.i18n?.lang || 'en';
    return this.topicsService.findAll(lang);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string, @Req() req: Request) {
    const lang = req.i18n?.lang || 'en';
    return this.topicsService.findBySlug(slug, lang);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const lang = req.i18n?.lang || 'en';
    return this.topicsService.findOne(id, lang);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateTopicDto: UpdateTopicDto) {
    return this.topicsService.update(id, updateTopicDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.topicsService.remove(id);
  }
}
