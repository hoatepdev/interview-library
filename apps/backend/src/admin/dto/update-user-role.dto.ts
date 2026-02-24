import { IsEnum, IsNotEmpty } from "class-validator";
import { UserRole } from "../../common/enums/role.enum";

export class UpdateUserRoleDto {
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}
