import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager } from "typeorm";
import {
  DomainEvent,
  DomainEventAction,
} from "../../database/entities/domain-event.entity";

@Injectable()
export class DomainEventService {
  constructor(
    @InjectRepository(DomainEvent)
    private readonly domainEventRepository: Repository<DomainEvent>,
  ) {}

  async log(
    entityType: string,
    entityId: string,
    action: DomainEventAction,
    actorId: string | null,
    metadata?: Record<string, any>,
    manager?: EntityManager,
  ): Promise<DomainEvent> {
    const repo = manager
      ? manager.getRepository(DomainEvent)
      : this.domainEventRepository;

    const event = repo.create({
      entityType,
      entityId,
      action,
      actorId,
      metadata: metadata ?? null,
    });

    return repo.save(event);
  }

  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<DomainEvent[]> {
    return this.domainEventRepository.find({
      where: { entityType, entityId },
      order: { createdAt: "DESC" },
    });
  }
}
