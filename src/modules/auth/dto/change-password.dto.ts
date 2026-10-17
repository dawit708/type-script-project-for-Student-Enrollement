import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty() current_password: string;
  @MinLength(6) new_password: string;
}
