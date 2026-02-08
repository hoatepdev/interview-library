import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
} from "@nestjs/common";
import { Response } from "express";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { SessionAuthGuard } from "./guards/session-auth.guard";
import { User } from "../database/entities/user.entity";

@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * Store locale in session before OAuth redirect
   */
  @Get("google")
  @UseGuards(AuthGuard("google"))
  googleLogin(@Req() req: any, @Query('locale') locale?: string) {
    // Store locale in session for use in callback
    if (locale) {
      req.session.oauthLocale = locale;
    }
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  googleAuthCallback(
    @Req() req: Request & { user: User; session: any },
    @Res() res: Response
  ) {
    const redirectUrl = this.buildRedirectUrl(req.session);

    // Manually login to establish session (triggers serializeUser)
    (req as any).login(req.user, (err: any) => {
      if (err) {
        this.logger.error(`OAuth login error: ${err}`);
        return res.status(500).json({ error: "Login failed" });
      }
      res.redirect(redirectUrl);
    });
  }

  /**
   * Store locale in session before OAuth redirect
   */
  @Get("github")
  @UseGuards(AuthGuard("github"))
  githubLogin(@Req() req: any, @Query('locale') locale?: string) {
    // Store locale in session for use in callback
    if (locale) {
      req.session.oauthLocale = locale;
    }
  }

  @Get("github/callback")
  @UseGuards(AuthGuard("github"))
  githubAuthCallback(
    @Req() req: Request & { user: User; session: any },
    @Res() res: Response
  ) {
    const redirectUrl = this.buildRedirectUrl(req.session);

    // Manually login to establish session (triggers serializeUser)
    (req as any).login(req.user, (err: any) => {
      if (err) {
        this.logger.error(`OAuth login error: ${err}`);
        return res.status(500).json({ error: "Login failed" });
      }
      res.redirect(redirectUrl);
    });
  }

  /**
   * Build the redirect URL with locale and auth_success flag
   */
  private buildRedirectUrl(session: any): string {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:9000";
    // Get locale from session (stored during OAuth init), default to 'en'
    const locale = session.oauthLocale || 'en';
    // Clear the stored locale
    delete session.oauthLocale;
    // Add locale and auth_success flag
    return `${frontendUrl}/${locale}?auth_success=1`;
  }

  @Get("me")
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

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  logout(@Req() req: any, @Res() res: Response) {
    req.logout((err: any) => {
      if (err) {
        return res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  }
}
