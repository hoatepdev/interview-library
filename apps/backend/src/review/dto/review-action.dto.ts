import { IsOptional, IsString } from "class-validator";

export class ReviewActionDto {
  @IsOptional()
  @IsString()
  note?: string;
}
