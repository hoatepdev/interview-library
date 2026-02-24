import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum DomainEventAction {
  DELETED = 'deleted',
  RESTORED = 'restored',
  FORCE_DELETED = 'force_deleted',
  RESTORE_BLOCKED = 'restore_blocked',
}

@Entity('domain_events')
@Index('IDX_domain_events_entity', ['entityType', 'entityId'])
@Index('IDX_domain_events_actor', ['actorId'])
@Index('IDX_domain_events_created_at', ['createdAt'])
export class DomainEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_type', length: 50 })
  entityType: string;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId: string;

  @Column({
    type: 'enum',
    enum: DomainEventAction,
  })
  action: DomainEventAction;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor: User;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
