import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from "@nestjs/common";
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
    return this.practiceService.getRandomQuestion(query, lang);
  }

  @Get("next")
  getNextQuestion(@Req() req: AuthenticatedRequest, @Query() query: QueryPracticeDto) {
    const lang = req.i18n?.lang || 'en';
    const userId = req.user?.id;
    return this.practiceService.getNextQuestionForPractice(query, lang, userId);
  }

  @Get("due-count")
  getDueQuestionsCount(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    return this.practiceService.getDueQuestionsCount(userId);
  }

  @Get("due")
  getQuestionsDueForReview(@Req() req: AuthenticatedRequest, @Query("limit") limit?: string) {
    const lang = req.i18n?.lang || 'en';
    const userId = req.user?.id;
    return this.practiceService.getQuestionsDueForReview(lang, limit ? parseInt(limit) : 20, userId);
  }

  @Post("log")
  @HttpCode(HttpStatus.CREATED)
  logPractice(@Req() req: AuthenticatedRequest, @Body() createPracticeLogDto: CreatePracticeLogDto) {
    const userId = req.user?.id;
    return this.practiceService.logPractice(createPracticeLogDto, userId);
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
