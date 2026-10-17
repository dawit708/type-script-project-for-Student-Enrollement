import { IsOptional, IsString } from 'class-validator';

export class RejectEnrollmentDto {
  @IsOptional() @IsString() reason?: string;
}
