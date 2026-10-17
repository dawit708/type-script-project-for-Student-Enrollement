import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateProgramDto {
  @IsInt() department_id: number;
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() code: string;
  @IsOptional() @IsInt() @Min(1) @Max(7) duration_years?: number;
  @IsOptional() @IsIn(['diploma', 'bachelor', 'master', 'phd']) degree_level?: string;
}
