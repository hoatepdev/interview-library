import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ThrottlerGuard, Throttle } from "@nestjs/throttler";
import { ReviewService } from "./review.service";
import { ReviewActionDto } from "./dto/review-action.dto";
import { RejectActionDto } from "./dto/reject-action.dto";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums/role.enum";
import { User } from "../database/entities/user.entity";

interface AuthenticatedRequest {
  user: User;
}

@Controller("review")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles(UserRole.MODERATOR, UserRole.ADMIN)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get("pending")
  getPending() {
    return this.reviewService.getPendingItems();
  }

  @Get("pending/count")
  getPendingCount() {
    return this.reviewService.getPendingCount();
  }

  @Get("revisions/:id")
  getRevision(@Param("id") id: string) {
    return this.reviewService.getRevision(id);
  }

  @Get("history")
  getHistory(@Query("limit") limit?: number) {
    return this.reviewService.getHistory(limit ? +limit : 50);
  }

  @Post("questions/:id/approve")
  @UseGuards(ThrottlerGuard)
  @Throttle({ strict: { ttl: 60000, limit: 20 } })
  @HttpCode(HttpStatus.OK)
  approveQuestion(
    @Param("id") id: string,
    @Body() dto: ReviewActionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reviewService.approveQuestion(id, req.user.id, dto.note);
  }

  @Post("questions/:id/reject")
  @UseGuards(ThrottlerGuard)
  @Throttle({ strict: { ttl: 60000, limit: 20 } })
  @HttpCode(HttpStatus.OK)
  rejectQuestion(
    @Param("id") id: string,
    @Body() dto: RejectActionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reviewService.rejectQuestion(id, req.user.id, dto.note);
  }

  @Post("revisions/:id/approve")
  @UseGuards(ThrottlerGuard)
  @Throttle({ strict: { ttl: 60000, limit: 20 } })
  @HttpCode(HttpStatus.OK)
  approveRevision(
    @Param("id") id: string,
    @Body() dto: ReviewActionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reviewService.approveRevision(id, req.user.id, dto.note);
  }

  @Post("revisions/:id/reject")
  @UseGuards(ThrottlerGuard)
  @Throttle({ strict: { ttl: 60000, limit: 20 } })
  @HttpCode(HttpStatus.OK)
  rejectRevision(
    @Param("id") id: string,
    @Body() dto: RejectActionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reviewService.rejectRevision(id, req.user.id, dto.note);
  }
}
