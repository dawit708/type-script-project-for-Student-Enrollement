import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateStudentDto {
  @IsOptional() @IsString() full_name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsInt() program_id?: number;
  @IsOptional() @IsIn(['male', 'female', 'other']) gender?: string;
  @IsOptional() @IsDateString() date_of_birth?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() guardian_name?: string;
  @IsOptional() @IsString() guardian_phone?: string;
  @IsOptional() @IsInt() @Min(1) @Max(7) current_year?: number;
  @IsOptional() @IsInt() @Min(1) @Max(2) current_semester?: number;
  @IsOptional() @IsIn(['active', 'graduated', 'dropped', 'suspended']) status?: string;
}
