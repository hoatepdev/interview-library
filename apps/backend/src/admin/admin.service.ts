import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../database/entities/user.entity";
import { UserRole } from "../common/enums/role.enum";
import { softDelete, restore } from "../common/utils/soft-delete.util";
import { DomainEventService } from "../common/services/domain-event.service";
import { DomainEventAction } from "../database/entities/domain-event.entity";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly domainEventService: DomainEventService,
  ) {}

  async getUsers(includeDeleted = false): Promise<User[]> {
    if (includeDeleted) {
      return this.userRepository.find({
        select: [
          "id",
          "email",
          "name",
          "avatar",
          "provider",
          "role",
          "createdAt",
          "deletedAt",
        ],
        order: { createdAt: "ASC" },
        withDeleted: true,
      });
    }
    return this.userRepository.find({
      select: [
        "id",
        "email",
        "name",
        "avatar",
        "provider",
        "role",
        "createdAt",
      ],
      order: { createdAt: "ASC" },
    });
  }

  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);
    user.role = role;
    return this.userRepository.save(user);
  }

  async softDeleteUser(userId: string, deletedByUserId: string): Promise<void> {
    await softDelete(this.userRepository, userId, deletedByUserId);

    await this.domainEventService.log(
      "user",
      userId,
      DomainEventAction.DELETED,
      deletedByUserId,
    );
  }

  async restoreUser(userId: string, actorId?: string): Promise<User> {
    return restore(this.userRepository, userId, {
      entityType: "user",
      uniqueConstraints: [
        { fields: ["email"], label: "email" },
        { fields: ["providerId"], label: "provider_id" },
      ],
      actorId,
      domainEventService: this.domainEventService,
    });
  }
}
