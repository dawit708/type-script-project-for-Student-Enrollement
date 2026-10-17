import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateCourseDto {
  @IsInt() department_id: number;
  @IsString() @IsNotEmpty() code: string;
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsInt() @Min(1) credit_hours?: number;
  @IsOptional() @IsInt() @Min(1) @Max(7) year_level?: number;
  @IsOptional() @IsInt() @Min(1) @Max(2) semester_no?: number;
  @IsOptional() @IsIn(['core', 'optional']) course_type?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() is_active?: boolean;
}
