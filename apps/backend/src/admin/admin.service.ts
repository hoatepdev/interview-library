import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { UserRole } from '../common/enums/role.enum';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getUsers(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'email', 'name', 'avatar', 'provider', 'role', 'createdAt'],
      order: { createdAt: 'ASC' },
    });
  }

  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);
    user.role = role;
    return this.userRepository.save(user);
  }
}
