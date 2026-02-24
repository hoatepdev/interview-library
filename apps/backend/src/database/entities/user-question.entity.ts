import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Question } from './question.entity';

@Entity('user_questions')
export class UserQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'question_id' })
  questionId: string;

  @ManyToOne(() => Question, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ name: 'is_public', default: false })
  isPublic: boolean;

  @Column({ name: 'is_favorite', default: false })
  isFavorite: boolean;

  // Spaced repetition tracking (user-specific)
  @Column({ name: 'next_review_at', nullable: true })
  nextReviewAt: Date;

  @Column({ name: 'ease_factor', type: 'decimal', precision: 4, scale: 2, default: 2.5 })
  easeFactor: number;

  @Column({ name: 'interval_days', default: 0 })
  intervalDays: number;

  @Column({ name: 'repetitions', default: 0 })
  repetitions: number;

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
}
