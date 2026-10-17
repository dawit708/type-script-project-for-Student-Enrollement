import { IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, Max, MaxLength } from 'class-validator';

export class CreatePaymentDto {
  @IsInt() student_id: number;
  @IsInt() semester_id: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @IsPositive() @Max(99999999.99) amount: number;
  @IsOptional() @IsIn(['cash', 'bank', 'mobile', 'online']) method?: string;
  @IsOptional() @IsString() @MaxLength(60) reference_no?: string;
  @IsOptional() @IsIn(['pending', 'paid']) status?: string; // default: paid
}

export class UpdatePaymentStatusDto {
  @IsIn(['pending', 'paid', 'failed', 'refunded']) status: string;
}
