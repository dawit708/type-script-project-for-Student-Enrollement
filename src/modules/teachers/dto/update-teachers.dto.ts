import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateTeacherDto {
  @IsOptional() @IsString() full_name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsInt() department_id?: number;
  @IsOptional() @IsString() qualification?: string;
  @IsOptional() @IsDateString() hire_date?: string;
}
