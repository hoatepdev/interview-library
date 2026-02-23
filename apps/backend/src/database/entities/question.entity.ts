import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Topic } from './topic.entity';
import { QuestionTranslation } from './question-translation.entity';
import { User } from './user.entity';
import { ContentStatus } from '../../common/enums/content-status.enum';

export enum QuestionLevel {
  JUNIOR = 'junior',
  MIDDLE = 'middle',
  SENIOR = 'senior',
}

export enum QuestionStatus {
  NEW = 'new',
  LEARNING = 'learning',
  MASTERED = 'mastered',
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

  @ManyToOne(() => Topic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topic_id' })
  topic: Topic;

  @Column({
    type: 'enum',
    enum: QuestionLevel,
    default: QuestionLevel.MIDDLE,
  })
  level: QuestionLevel;

  @Column({
    type: 'enum',
    enum: QuestionStatus,
    default: QuestionStatus.NEW,
  })
  status: QuestionStatus;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'difficulty_score', default: 0 })
  difficultyScore: number;

  @Column({ name: 'practice_count', default: 0 })
  practiceCount: number;

  @Column({ name: 'last_practiced_at', nullable: true })
  lastPracticedAt: Date;

  @Column({ name: 'next_review_at', nullable: true })
  nextReviewAt: Date;

  // Spaced repetition tracking
  @Column({ name: 'ease_factor', type: 'decimal', precision: 4, scale: 2, default: 2.5 })
  easeFactor: number;

  @Column({ name: 'interval_days', default: 0 })
  intervalDays: number;

  @Column({ name: 'repetitions', default: 0 })
  repetitions: number;

  @Column({
    type: 'enum',
    enum: ContentStatus,
    default: ContentStatus.APPROVED,
    name: 'content_status',
  })
  contentStatus: ContentStatus;

  @Column({ name: 'review_note', type: 'text', nullable: true })
  reviewNote: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => QuestionTranslation, translation => translation.question, { cascade: true })
  translations: QuestionTranslation[];
}
