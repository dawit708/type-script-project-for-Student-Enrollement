import { IsInt } from 'class-validator';

export class RequestEnrollmentDto {
  @IsInt() section_id: number;
}
