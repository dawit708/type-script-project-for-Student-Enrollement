import { PartialType } from '@nestjs/swagger';
import { CreateSectionDto } from './create-sections.dto';

export class UpdateSectionDto extends PartialType(CreateSectionDto) {}
