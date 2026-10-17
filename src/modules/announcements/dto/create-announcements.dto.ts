import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString() @IsNotEmpty() @MaxLength(200) title: string;
  @IsString() @IsNotEmpty() @MaxLength(5000) message: string;
  @IsOptional() @IsIn(['all', 'admin', 'registrar', 'teacher', 'student']) target_role?: string;
  @IsOptional() @IsInt() section_id?: number;
}
