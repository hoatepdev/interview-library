import { Controller, Get, Post, Delete, Patch, Param, Body, Query, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { User } from '../database/entities/user.entity';

interface AuthenticatedRequest extends Request {
  user: User;
}

@Controller('admin')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getUsers(@Query('includeDeleted') includeDeleted?: string) {
    return this.adminService.getUsers(includeDeleted === 'true');
  }

  @Patch('users/:id/role')
  @UseGuards(ThrottlerGuard)
  @Throttle({ strict: { ttl: 60000, limit: 20 } })
  updateUserRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.adminService.updateUserRole(id, dto.role);
  }

  @Delete('users/:id')
  @UseGuards(ThrottlerGuard)
  @Throttle({ strict: { ttl: 60000, limit: 20 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDeleteUser(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.adminService.softDeleteUser(id, req.user.id);
  }

  @Post('users/:id/restore')
  @UseGuards(ThrottlerGuard)
  @Throttle({ strict: { ttl: 60000, limit: 20 } })
  @HttpCode(HttpStatus.OK)
  restoreUser(@Param('id') id: string) {
    return this.adminService.restoreUser(id);
  }
}
