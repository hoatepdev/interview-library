import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { UserQuestion } from './user-question.entity';
import { PracticeLog } from './practice-log.entity';
import { UserRole } from '../../common/enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ default: 'google' })
  provider: string;

  @Column({ name: 'provider_id' })
  providerId: string;

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

  @OneToMany(() => UserQuestion, q => q.user)
  personalQuestions: UserQuestion[];

  @OneToMany(() => PracticeLog, log => log.user)
  practiceLogs: PracticeLog[];
}
