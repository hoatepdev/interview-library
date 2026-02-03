import { PassportSerializer } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthSerializer extends PassportSerializer {
  private readonly logger = new Logger(AuthSerializer.name);

  constructor(private authService: AuthService) {
    super();
  }

  serializeUser(user: any, done: (err: Error, user?: any) => void): void {
    this.logger.log(`=== Serializing User ===`);
    this.logger.log(`User data: ${JSON.stringify({ id: user?.id, email: user?.email })}`);
    this.logger.log(`Serializing user ID: ${user?.id}`);
    done(null, user.id);
  }

  async deserializeUser(userId: string, done: (err: Error, user?: any) => void): Promise<void> {
    this.logger.log(`=== Deserializing User ===`);
    this.logger.log(`User ID from session: ${userId}`);
    try {
      // Fetch full user from database using userId
      const user = await this.authService.findById(userId);
      if (user) {
        this.logger.log(`✓ Deserialized user: ${JSON.stringify({ id: user.id, email: user.email })}`);
      } else {
        this.logger.warn(`✗ User not found for ID: ${userId}`);
      }
      done(null, user);
    } catch (error) {
      this.logger.error(`✗ Error deserializing user: ${error}`);
      done(error as Error, null);
    }
  }
}
