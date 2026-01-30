import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Topic } from './topic.entity';

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

  @Column({ name: 'is_favorite', default: false })
  isFavorite: boolean;

  @Column({ name: 'difficulty_score', default: 0 })
  difficultyScore: number;

  @Column({ name: 'practice_count', default: 0 })
  practiceCount: number;

  @Column({ name: 'last_practiced_at', nullable: true })
  lastPracticedAt: Date;

  @Column({ type: 'int', default: 0 })
  order: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
