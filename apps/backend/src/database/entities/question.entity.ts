import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, DeleteDateColumn } from 'typeorm';
import { Topic } from './topic.entity';
import { QuestionTranslation } from './question-translation.entity';
import { User } from './user.entity';
import { ContentStatus } from '../../common/enums/content-status.enum';

export enum QuestionLevel {
  JUNIOR = 'junior',
  MIDDLE = 'middle',
  SENIOR = 'senior',
}

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // English (default language) - kept as source of truth
  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  answer: string;

  @Column({ name: 'topic_id' })
  topicId: string;

  @ManyToOne(() => Topic, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'topic_id' })
  topic: Topic;

  @Column({
    type: 'enum',
    enum: QuestionLevel,
    default: QuestionLevel.MIDDLE,
  })
  level: QuestionLevel;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'difficulty_score', default: 0 })
  difficultyScore: number;

  @Column({
    type: 'enum',
    enum: ContentStatus,
    default: ContentStatus.APPROVED,
    name: 'content_status',
  })
  contentStatus: ContentStatus;

  @Column({ name: 'review_note', type: 'text', nullable: true })
  reviewNote: string;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column({ name: 'deleted_by', nullable: true })
  deletedBy: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deletedByUser: User;

  @OneToMany(() => QuestionTranslation, translation => translation.question, { cascade: true })
  translations: QuestionTranslation[];
}
