import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SaveSettingDto {
  @IsString() @IsNotEmpty() @MaxLength(255) setting_value: string;
  @IsOptional() @IsString() @MaxLength(255) description?: string;
}
