import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';

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

    this.logger.log(`OAuth ${provider} callback for email: ${email}`);

    if (!email) {
      throw new Error('Email is required from OAuth provider');
    }

    let user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      this.logger.log(`Creating new user for email: ${email}`);
      user = this.userRepository.create({
        email,
        name: displayName || email.split('@')[0],
        avatar: photos?.[0]?.value,
        provider,
        providerId: id,
      });
      await this.userRepository.save(user);
      this.logger.log(`User created with ID: ${user.id}`);
    } else {
      // Update user info if changed
      if (displayName && user.name !== displayName) {
        user.name = displayName;
      }
      if (photos?.[0]?.value && user.avatar !== photos[0].value) {
        user.avatar = photos[0].value;
      }
      await this.userRepository.save(user);
      this.logger.log(`User updated: ${user.id}`);
    }

    this.logger.log(`OAuth validation successful for user: ${user.id}`);
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
