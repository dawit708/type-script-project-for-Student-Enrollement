import { IsDateString, IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateStudentDto {
  // login account
  @IsString() @IsNotEmpty() full_name: string;
  @IsEmail() email: string;
  @MinLength(6) password: string;
  @IsOptional() @IsString() phone?: string;

  // student profile
  @IsInt() program_id: number;
  @IsOptional() @IsString() student_no?: string;
  @IsOptional() @IsIn(['male', 'female', 'other']) gender?: string;
  @IsOptional() @IsDateString() date_of_birth?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() guardian_name?: string;
  @IsOptional() @IsString() guardian_phone?: string;
  @IsOptional() @IsDateString() admission_date?: string;
  @IsOptional() @IsInt() @Min(1) @Max(7) current_year?: number;
  @IsOptional() @IsInt() @Min(1) @Max(2) current_semester?: number;
}
