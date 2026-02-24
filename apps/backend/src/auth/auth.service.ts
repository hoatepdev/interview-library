import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { UserRole } from '../common/enums/role.enum';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async validateOAuthUser(profile: any, provider: string) {
    const { id, emails, displayName, photos } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      throw new Error('Email is required from OAuth provider');
    }

    // Check for soft-deleted user first — block re-login
    const deletedUser = await this.userRepository.findOne({
      where: { email, deletedAt: Not(IsNull()) },
      withDeleted: true,
    });
    if (deletedUser) {
      throw new ForbiddenException('This account has been deactivated. Contact an administrator.');
    }

    let user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      this.logger.log(`Creating new user: ${email}`);
      // First user in the system gets ADMIN role
      const userCount = await this.userRepository.count();
      const role = userCount === 0 ? UserRole.ADMIN : UserRole.USER;
      user = this.userRepository.create({
        email,
        name: displayName || email.split('@')[0],
        avatar: photos?.[0]?.value,
        provider,
        providerId: id,
        role,
      });
      await this.userRepository.save(user);
    } else {
      // Update user info if changed
      if (displayName && user.name !== displayName) {
        user.name = displayName;
      }
      if (photos?.[0]?.value && user.avatar !== photos[0].value) {
        user.avatar = photos[0].value;
      }
      await this.userRepository.save(user);
    }

    return user;
  }

  async getUserProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findById(userId: string) {
    return this.userRepository.findOne({ where: { id: userId } });
  }
}
