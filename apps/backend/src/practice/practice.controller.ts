import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ThrottlerGuard, Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { PracticeService } from "./practice.service";
import { CreatePracticeLogDto } from "./dto/create-practice-log.dto";
import { QueryPracticeDto } from "./dto/query-practice.dto";
import { User } from "../database/entities/user.entity";

interface AuthenticatedRequest extends Request {
  user?: User;
}

@Controller("practice")
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Get("random")
  getRandomQuestion(@Req() req: AuthenticatedRequest, @Query() query: QueryPracticeDto) {
    const lang = req.i18n?.lang || 'en';
    const userId = req.user?.id;
    return this.practiceService.getRandomQuestion(query, lang, userId);
  }

  @Get("next")
  getNextQuestion(@Req() req: AuthenticatedRequest, @Query() query: QueryPracticeDto) {
    const lang = req.i18n?.lang || 'en';
    const userId = req.user?.id;
    return this.practiceService.getNextQuestionForPractice(query, lang, userId);
  }

  @Get("due-count")
  async getDueQuestionsCount(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    const count = await this.practiceService.getDueQuestionsCount(userId);
    return { count };
  }

  @Get("due")
  getQuestionsDueForReview(@Req() req: AuthenticatedRequest, @Query("limit") limit?: string) {
    const lang = req.i18n?.lang || 'en';
    const userId = req.user?.id;
    return this.practiceService.getQuestionsDueForReview(lang, limit ? parseInt(limit) : 20, userId);
  }

  @Post("log")
  @UseGuards(ThrottlerGuard)
  @Throttle({ strict: { ttl: 60000, limit: 20 } })
  @HttpCode(HttpStatus.CREATED)
  logPractice(@Req() req: AuthenticatedRequest, @Body() createPracticeLogDto: CreatePracticeLogDto) {
    const userId = req.user?.id;
    return this.practiceService.logPractice(createPracticeLogDto, userId);
  }

  @Get("analytics")
  getAnalytics(@Req() req: AuthenticatedRequest, @Query("days") days?: string) {
    const lang = req.i18n?.lang || 'en';
    const userId = req.user?.id;
    return this.practiceService.getAnalytics(lang, userId, days ? parseInt(days) : 30);
  }

  @Get("stats")
  getStats(@Req() req: AuthenticatedRequest) {
    const lang = req.i18n?.lang || 'en';
    const userId = req.user?.id;
    return this.practiceService.getStats(lang, userId);
  }

  @Get("history")
  getHistory(@Req() req: AuthenticatedRequest, @Query("limit") limit?: string) {
    const lang = req.i18n?.lang || 'en';
    const userId = req.user?.id;
    return this.practiceService.getHistory(limit ? parseInt(limit) : 20, lang, userId);
  }
}
