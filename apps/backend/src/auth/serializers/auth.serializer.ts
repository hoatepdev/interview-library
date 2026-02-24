import { PassportSerializer } from "@nestjs/passport";
import { Injectable, Logger } from "@nestjs/common";
import { AuthService } from "../auth.service";

@Injectable()
export class AuthSerializer extends PassportSerializer {
  private readonly logger = new Logger(AuthSerializer.name);

  constructor(private authService: AuthService) {
    super();
  }

  serializeUser(user: any, done: (err: Error, user?: any) => void): void {
    done(null, user.id);
  }

  async deserializeUser(
    userId: string,
    done: (err: Error, user?: any) => void,
  ): Promise<void> {
    try {
      const user = await this.authService.findById(userId);
      done(null, user);
    } catch (error) {
      this.logger.error(`Error deserializing user: ${error}`);
      done(error as Error, null);
    }
  }
}
