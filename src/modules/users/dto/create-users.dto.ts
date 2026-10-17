import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString() @IsNotEmpty() full_name: string;
  @IsEmail() email: string;
  @MinLength(6) password: string;
  @IsOptional() @IsString() phone?: string;
  // students and teachers are created from /students and /teachers
  @IsIn(['admin', 'registrar']) role: string;
}
