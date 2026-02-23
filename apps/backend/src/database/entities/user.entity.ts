import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserQuestion } from './user-question.entity';
import { PracticeLog } from './practice-log.entity';
import { UserRole } from '../../common/enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
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

  @Column({ unique: true, name: 'provider_id' })
  providerId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => UserQuestion, q => q.user)
  personalQuestions: UserQuestion[];

  @OneToMany(() => PracticeLog, log => log.user)
  practiceLogs: PracticeLog[];
}
