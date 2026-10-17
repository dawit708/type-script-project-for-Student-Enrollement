import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional() @IsString() full_name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsIn(['active', 'disabled']) status?: string;
  @IsOptional() @MinLength(6) password?: string;
}
