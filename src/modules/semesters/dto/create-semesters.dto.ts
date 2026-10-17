import { IsBoolean, IsDateString, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSemesterDto {
  @IsString() @IsNotEmpty() academic_year: string;
  @IsIn(['1', '2', 'summer']) term: string;
  @IsDateString() start_date: string;
  @IsDateString() end_date: string;
  @IsOptional() @IsDateString() enrollment_start?: string;
  @IsOptional() @IsDateString() enrollment_end?: string;
  @IsOptional() @IsBoolean() is_enrollment_open?: boolean;
  @IsOptional() @IsBoolean() is_current?: boolean;
}
