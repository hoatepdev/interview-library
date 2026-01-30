import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { PracticeService } from "./practice.service";
import { CreatePracticeLogDto } from "./dto/create-practice-log.dto";
import { QueryPracticeDto } from "./dto/query-practice.dto";

@Controller("practice")
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Get("random")
  getRandomQuestion(@Query() query: QueryPracticeDto) {
    return this.practiceService.getRandomQuestion(query);
  }

  @Post("log")
  @HttpCode(HttpStatus.CREATED)
  logPractice(@Body() createPracticeLogDto: CreatePracticeLogDto) {
    return this.practiceService.logPractice(createPracticeLogDto);
  }

  @Get("stats")
  getStats() {
    return this.practiceService.getStats();
  }

  @Get("history")
  getHistory(@Query("limit") limit?: string) {
    return this.practiceService.getHistory(limit ? parseInt(limit) : 20);
  }
}
