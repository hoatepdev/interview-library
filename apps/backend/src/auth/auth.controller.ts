import { Controller, Get, Post, Req, Res, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { User } from '../database/entities/user.entity';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthCallback(@Req() req: Request & { user: User }, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Debug: Log session state after OAuth
    this.logger.log(`=== Google OAuth Callback ===`);
    this.logger.log(`User in request: ${req.user ? JSON.stringify({ id: req.user.id, email: req.user.email }) : 'undefined'}`);
    this.logger.log(`Session ID: ${(req as any).sessionID}`);
    this.logger.log(`Session data: ${JSON.stringify((req as any).session?.['passport'] || {})}`);

    // Manually login to ensure session is established
    // This triggers serializeUser and saves the session
    (req as any).login(req.user, (err: any) => {
      if (err) {
        this.logger.error(`Login error: ${err}`);
        return res.status(500).json({ error: 'Login failed' });
      }

      this.logger.log(`Session after login: ${JSON.stringify((req as any).session?.['passport'] || {})}`);
      this.logger.log(`Redirecting to frontend: ${frontendUrl}`);
      res.redirect(frontendUrl);
    });
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubLogin() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  githubAuthCallback(@Req() req: Request & { user: User }, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Debug: Log session state after OAuth
    this.logger.log(`=== GitHub OAuth Callback ===`);
    this.logger.log(`User in request: ${req.user ? JSON.stringify({ id: req.user.id, email: req.user.email }) : 'undefined'}`);
    this.logger.log(`Session ID: ${(req as any).sessionID}`);
    this.logger.log(`Session data: ${JSON.stringify((req as any).session?.['passport'] || {})}`);

    // Manually login to ensure session is established
    // This triggers serializeUser and saves the session
    (req as any).login(req.user, (err: any) => {
      if (err) {
        this.logger.error(`Login error: ${err}`);
        return res.status(500).json({ error: 'Login failed' });
      }

      this.logger.log(`Session after login: ${JSON.stringify((req as any).session?.['passport'] || {})}`);
      this.logger.log(`Redirecting to frontend: ${frontendUrl}`);
      res.redirect(frontendUrl);
    });
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.OK)
  getProfile(@Req() req: any) {
    return {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      avatar: req.user.avatar,
      provider: req.user.provider,
    };
  }

  @Get('debug-session')
  @HttpCode(HttpStatus.OK)
  debugSession(@Req() req: any) {
    return {
      hasSession: !!req.session,
      sessionID: req.sessionID,
      sessionPassport: req.session?.['passport'] || null,
      requestUser: req.user ? { id: req.user.id, email: req.user.email } : null,
      cookies: req.cookies,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Req() req: any, @Res() res: Response) {
    req.logout((err: any) => {
      if (err) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Logout failed' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  }
}
