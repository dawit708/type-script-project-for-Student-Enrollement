import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Min } from 'class-validator';

const TIME = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export class CreateSectionDto {
  @IsInt() course_id: number;
  @IsOptional() @IsInt() teacher_id?: number; // teachers.id (not users.id)
  @IsInt() semester_id: number;
  @IsString() @IsNotEmpty() section_name: string;
  @IsOptional() @IsString() room?: string;
  @IsIn(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) day_of_week: string;
  @Matches(TIME, { message: 'start_time must be HH:MM (24 hour)' }) start_time: string;
  @Matches(TIME, { message: 'end_time must be HH:MM (24 hour)' }) end_time: string;
  @IsOptional() @IsInt() @Min(1) capacity?: number;
}
