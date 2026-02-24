import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { TopicTranslation } from './topic-translation.entity';
import { Question } from './question.entity';
import { User } from './user.entity';
import { ContentStatus } from '../../common/enums/content-status.enum';

@Entity('topics')
export class Topic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // English (default language) - kept as source of truth
  @Column({ length: 100 })
  name: string;

  @Column({ length: 100 })
  slug: string;

  @Column({ length: 7, nullable: true })
  color: string;

  @Column({ length: 50, nullable: true })
  icon: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ContentStatus,
    default: ContentStatus.APPROVED,
    name: 'content_status',
  })
  contentStatus: ContentStatus;

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

  @OneToMany(() => TopicTranslation, translation => translation.topic, { cascade: true })
  translations: TopicTranslation[];

  @OneToMany(() => Question, question => question.topic, { nullable: true })
  questions: Question[];
}
