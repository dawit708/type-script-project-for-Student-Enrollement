import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

// send null to clear a mark
export class SaveGradeDto {
  @IsInt() enrollment_id: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(20) assignment_mark?: number | null;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(30) midterm_mark?: number | null;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(50) final_mark?: number | null;
}
