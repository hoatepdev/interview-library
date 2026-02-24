import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Question } from './question.entity';
import { User } from './user.entity';
import { ContentStatus } from '../../common/enums/content-status.enum';
import { QuestionLevel } from './question.entity';

@Entity('question_revisions')
export class QuestionRevision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'question_id' })
  questionId: string;

  @ManyToOne(() => Question, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ name: 'submitted_by', nullable: true })
  submittedBy: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'submitted_by' })
  submitter: User;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  answer: string;

  @Column({
    type: 'enum',
    enum: QuestionLevel,
    nullable: true,
  })
  level: QuestionLevel;

  @Column({ name: 'topic_id', nullable: true })
  topicId: string;

  @Column({
    type: 'enum',
    enum: ContentStatus,
    default: ContentStatus.PENDING_REVIEW,
    name: 'content_status',
  })
  contentStatus: ContentStatus;

  @Column({ name: 'review_note', type: 'text', nullable: true })
  reviewNote: string;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedBy: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: User;

  @Column({ name: 'reviewed_at', nullable: true })
  reviewedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column({ name: 'deleted_by', nullable: true })
  deletedBy: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deletedByUser: User;
}
