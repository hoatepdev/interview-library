import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum ReviewAction {
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ReviewTargetType {
  QUESTION = 'question',
  QUESTION_REVISION = 'question_revision',
}

@Entity('content_reviews')
export class ContentReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'target_type',
    type: 'enum',
    enum: ReviewTargetType,
  })
  targetType: ReviewTargetType;

  @Column({ name: 'target_id' })
  targetId: string;

  @Column({ type: 'enum', enum: ReviewAction })
  action: ReviewAction;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ name: 'reviewer_id', nullable: true })
  reviewerId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
