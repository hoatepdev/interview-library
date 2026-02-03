import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { AuthSerializer } from './serializers/auth.serializer';
import { User } from '../database/entities/user.entity';
import { QuestionFavorite } from '../database/entities/question-favorite.entity';
import { UserQuestion } from '../database/entities/user-question.entity';

@Module({
  imports: [
    PassportModule.register({ session: true }),
    TypeOrmModule.forFeature([User, QuestionFavorite, UserQuestion]),
  ],
  providers: [
    AuthService,
    GoogleStrategy,
    GitHubStrategy,
    SessionAuthGuard,
    AuthSerializer,
  ],
  controllers: [AuthController],
  exports: [AuthService, SessionAuthGuard],
})
export class AuthModule {}
