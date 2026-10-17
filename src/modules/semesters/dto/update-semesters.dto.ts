import { PartialType } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { CreateSemesterDto } from './create-semesters.dto';

export class UpdateSemesterDto extends PartialType(CreateSemesterDto) {}

export class ToggleEnrollmentDto {
  @IsBoolean() is_enrollment_open: boolean;
}
