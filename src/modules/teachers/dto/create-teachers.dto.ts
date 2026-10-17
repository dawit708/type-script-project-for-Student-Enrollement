import { IsDateString, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTeacherDto {
  // login account
  @IsString() @IsNotEmpty() full_name: string;
  @IsEmail() email: string;
  @MinLength(6) password: string;
  @IsOptional() @IsString() phone?: string;

  // teacher profile
  @IsInt() department_id: number;
  @IsOptional() @IsString() employee_no?: string;
  @IsOptional() @IsString() qualification?: string;
  @IsOptional() @IsDateString() hire_date?: string;
}
