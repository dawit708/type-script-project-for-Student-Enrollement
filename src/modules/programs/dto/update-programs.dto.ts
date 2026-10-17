import { PartialType } from '@nestjs/swagger';
import { CreateProgramDto } from './create-programs.dto';

export class UpdateProgramDto extends PartialType(CreateProgramDto) {}
