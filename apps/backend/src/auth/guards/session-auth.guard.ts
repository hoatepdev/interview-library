import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { CanActivate } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  private readonly logger = new Logger(SessionAuthGuard.name);

  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check if user is already attached (from session deserialization by Passport)
    if (request.user && typeof request.user === 'object' && 'id' in request.user) {
      return true;
    }

    // If Passport session middleware didn't deserialize user, try manually
    const sessionUser = request.session?.['passport']?.user;

    if (!sessionUser) {
      throw new UnauthorizedException('No active session. Please login.');
    }

    // Fetch full user from database
    const user = await this.authService.findById(sessionUser);
    if (!user) {
      this.logger.warn(`User not found in database for session id: ${sessionUser}`);
      throw new UnauthorizedException('User not found');
    }

    // Attach user to request for downstream handlers
    request.user = user;
    return true;
  }
}
