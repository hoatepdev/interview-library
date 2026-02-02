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

@Controller("practice")
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Get("random")
  getRandomQuestion(@Req() req: Request, @Query() query: QueryPracticeDto) {
    const lang = req.i18n?.lang || 'en';
    return this.practiceService.getRandomQuestion(query, lang);
  }

  @Get("due")
  getQuestionsDueForReview(@Req() req: Request, @Query("limit") limit?: string) {
    const lang = req.i18n?.lang || 'en';
    return this.practiceService.getQuestionsDueForReview(lang, limit ? parseInt(limit) : 20);
  }

  @Post("log")
  @HttpCode(HttpStatus.CREATED)
  logPractice(@Body() createPracticeLogDto: CreatePracticeLogDto) {
    return this.practiceService.logPractice(createPracticeLogDto);
  }

  @Get("stats")
  getStats(@Req() req: Request) {
    const lang = req.i18n?.lang || 'en';
    return this.practiceService.getStats(lang);
  }

  @Get("history")
  getHistory(@Req() req: Request, @Query("limit") limit?: string) {
    const lang = req.i18n?.lang || 'en';
    return this.practiceService.getHistory(limit ? parseInt(limit) : 20, lang);
  }
}
