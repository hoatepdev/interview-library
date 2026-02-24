import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Patch,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ThrottlerGuard, Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { QuestionsService } from "./questions.service";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { QueryQuestionsDto } from "./dto/query-questions.dto";
import { User } from "../database/entities/user.entity";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums/role.enum";

interface AuthenticatedRequest extends Request {
  user?: User;
}

@Controller("questions")
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @UseGuards(ThrottlerGuard)
  @Throttle({ strict: { ttl: 60000, limit: 20 } })
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createQuestionDto: CreateQuestionDto,
  ) {
    return this.questionsService.create(createQuestionDto, req.user);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest, @Query() query: QueryQuestionsDto) {
    const lang = req.i18n?.lang || "en";
    return this.questionsService.findAll(query, lang, req.user);
  }

  @Get("by-topic-slug/:slug")
  getByTopicSlug(
    @Param("slug") slug: string,
    @Query() query: QueryQuestionsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const lang = req.i18n?.lang || "en";
    return this.questionsService.getByTopicSlug(slug, query, lang, req.user);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    const lang = req.i18n?.lang || "en";
    return this.questionsService.findOne(id, lang, req.user);
  }

  @Put(":id")
  @UseGuards(ThrottlerGuard)
  @Throttle({ strict: { ttl: 60000, limit: 20 } })
  @UseGuards(SessionAuthGuard)
  update(
    @Param("id") id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.questionsService.update(id, updateQuestionDto, req.user);
  }

  @Patch(":id/favorite")
  @UseGuards(ThrottlerGuard)
  @Throttle({ strict: { ttl: 60000, limit: 20 } })
  @UseGuards(SessionAuthGuard)
  toggleFavorite(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    return this.questionsService.toggleFavorite(id, req.user.id);
  }

  @Delete(":id")
  @UseGuards(ThrottlerGuard, SessionAuthGuard)
  @Throttle({ strict: { ttl: 60000, limit: 20 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    await this.questionsService.remove(id, req.user);
  }

  @Post(":id/restore")
  @UseGuards(ThrottlerGuard)
  @Throttle({ strict: { ttl: 60000, limit: 20 } })
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async restore(@Param("id") id: string) {
    return this.questionsService.restore(id);
  }
}
