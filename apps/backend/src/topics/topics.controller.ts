import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
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
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateTopicDto: UpdateTopicDto) {
    return this.topicsService.update(id, updateTopicDto);
  }

  @Delete(':id')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.topicsService.remove(id);
  }
}
