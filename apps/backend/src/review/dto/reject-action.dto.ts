import { IsNotEmpty, IsString } from "class-validator";

export class RejectActionDto {
  @IsNotEmpty()
  @IsString()
  note: string;
}
