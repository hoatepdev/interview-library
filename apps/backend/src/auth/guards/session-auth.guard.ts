import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { CanActivate } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  private readonly logger = new Logger(SessionAuthGuard.name);

  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Debug: Log session state
    this.logger.debug(`=== Session Guard Check ===`);
    this.logger.debug(`Has session: ${!!request.session}`);
    this.logger.debug(`Session ID: ${request.sessionID}`);
    this.logger.debug(`Session passport: ${JSON.stringify(request.session?.['passport'] || {})}`);
    this.logger.debug(`Request user: ${JSON.stringify(request.user || {})}`);

    // Check if user is already attached (from session deserialization by Passport)
    if (request.user && typeof request.user === 'object' && 'id' in request.user) {
      this.logger.debug(`✓ User already attached from deserialization: ${request.user.id}`);
      return true;
    }

    // If Passport session middleware didn't deserialize user, try manually
    const sessionUser = request.session?.['passport']?.user;
    this.logger.debug(`Session user from passport: ${sessionUser}`);

    if (!sessionUser) {
      this.logger.warn(`✗ No session found - throwing UnauthorizedException`);
      throw new UnauthorizedException('No active session. Please login.');
    }

    // Fetch full user from database
    const user = await this.authService.findById(sessionUser);
    if (!user) {
      this.logger.warn(`✗ User not found in database for id: ${sessionUser}`);
      throw new UnauthorizedException('User not found');
    }

    // Attach user to request for downstream handlers
    request.user = user;
    this.logger.debug(`✓ Manually attached user to request: ${user.id}`);
    return true;
  }
}
