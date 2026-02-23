import { Controller, Get, Post, Put, Delete, Body, Param, Patch, Query, HttpCode, HttpStatus, Req, Res, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { QuestionsService } from './questions.service';
import { QuestionExportImportService, ImportResult } from './question-export-import.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { UpdateQuestionStatusDto } from './dto/update-question-status.dto';
import { QueryQuestionsDto } from './dto/query-questions.dto';
import { ExportQuestionsDto } from './dto/export-questions.dto';
import { User } from '../database/entities/user.entity';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';

interface AuthenticatedRequest extends Request {
  user?: User;
}

@Controller('questions')
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly exportImportService: QuestionExportImportService,
  ) {}

  @Post()
  @Throttle({ strict: { ttl: 60000, limit: 20 } })
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: AuthenticatedRequest, @Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(createQuestionDto, req.user);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest, @Query() query: QueryQuestionsDto) {
    const lang = req.i18n?.lang || 'en';
    return this.questionsService.findAll(query, lang, req.user);
  }

  @Get('export')
  @Throttle({ strict: { ttl: 60000, limit: 10 } })
  @UseGuards(SessionAuthGuard)
  async exportQuestions(
    @Query() query: ExportQuestionsDto,
    @Res() res: Response,
  ) {
    const data = await this.exportImportService.exportQuestions(query);

    if (query.format === 'csv') {
      const csv = this.exportImportService.formatAsCsv(data);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="questions-export.csv"');
      return res.send(csv);
    }

    const json = this.exportImportService.formatAsJson(data);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="questions-export.json"');
    return res.send(json);
  }

  @Post('import')
  @Throttle({ strict: { ttl: 60000, limit: 5 } })
  @UseGuards(SessionAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.originalname.match(/\.(json|csv)$/i)) {
        return cb(new BadRequestException('Only .json and .csv files are allowed'), false);
      }
      cb(null, true);
    },
  }))
  @HttpCode(HttpStatus.OK)
  async importQuestions(
    @UploadedFile() file: { buffer: Buffer; originalname: string },
    @Req() req: AuthenticatedRequest,
  ): Promise<ImportResult> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const content = file.buffer.toString('utf-8');
    const filename = file.originalname.toLowerCase();

    let rows;
    if (filename.endsWith('.json')) {
      rows = this.exportImportService.parseJsonImport(content);
    } else if (filename.endsWith('.csv')) {
      rows = this.exportImportService.parseCsvImport(content);
    } else {
      throw new BadRequestException('Unsupported file format. Use .json or .csv');
    }

    return this.exportImportService.importQuestions(rows, req.user);
  }

  @Get('by-topic-slug/:slug')
  getByTopicSlug(@Param('slug') slug: string, @Query() query: QueryQuestionsDto, @Req() req: AuthenticatedRequest) {
    const lang = req.i18n?.lang || 'en';
    return this.questionsService.getByTopicSlug(slug, query, lang, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const lang = req.i18n?.lang || 'en';
    return this.questionsService.findOne(id, lang, req.user);
  }

  @Put(':id')
  @Throttle({ strict: { ttl: 60000, limit: 20 } })
  @UseGuards(SessionAuthGuard)
  update(@Param('id') id: string, @Body() updateQuestionDto: UpdateQuestionDto, @Req() req: AuthenticatedRequest) {
    return this.questionsService.update(id, updateQuestionDto, req.user);
  }

  @Patch(':id/status')
  @Throttle({ strict: { ttl: 60000, limit: 20 } })
  updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateQuestionStatusDto) {
    return this.questionsService.updateStatus(id, updateStatusDto);
  }

  @Patch(':id/favorite')
  @Throttle({ strict: { ttl: 60000, limit: 20 } })
  @UseGuards(SessionAuthGuard)
  toggleFavorite(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.questionsService.toggleFavorite(id, req.user.id);
  }

  @Delete(':id')
  @Throttle({ strict: { ttl: 60000, limit: 20 } })
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.questionsService.remove(id, req.user);
  }
}
