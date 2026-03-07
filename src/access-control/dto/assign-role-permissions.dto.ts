import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsString } from 'class-validator';

export class AssignRolePermissionsDto {
  @ApiProperty({
    type: [String],
    example: ['users.view', 'users.create', 'security.permissions.assign'],
  })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permission_keys: string[];
}
