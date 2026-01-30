import { IsEnum, IsOptional, IsInt, IsUUID, IsString, Min } from 'class-validator';
import { SelfRating } from '../../database/entities/practice-log.entity';

export class CreatePracticeLogDto {
  @IsUUID()
  questionId: string;

  @IsEnum(SelfRating)
  selfRating: SelfRating;

  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpentSeconds?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
