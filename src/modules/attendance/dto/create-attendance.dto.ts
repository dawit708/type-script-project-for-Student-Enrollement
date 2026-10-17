import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';

export class AttendanceRecordDto {
  @IsInt() enrollment_id: number;
  @IsIn(['present', 'absent', 'late', 'excused']) status: string;
  @IsOptional() @IsString() remark?: string;
}

export class TakeAttendanceDto {
  @IsInt() section_id: number;
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' }) date: string;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => AttendanceRecordDto)
  records: AttendanceRecordDto[];
}
