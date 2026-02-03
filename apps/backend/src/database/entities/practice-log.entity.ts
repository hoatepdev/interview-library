import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Question } from './question.entity';
import { User } from './user.entity';

export enum SelfRating {
  POOR = 'poor',
  FAIR = 'fair',
  GOOD = 'good',
  GREAT = 'great',
}

@Entity('practice_logs')
export class PracticeLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'question_id' })
  questionId: string;

  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: SelfRating,
    name: 'self_rating',
  })
  selfRating: SelfRating;

  @Column({ name: 'time_spent_seconds', nullable: true })
  timeSpentSeconds: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'practiced_at' })
  practicedAt: Date;
}
