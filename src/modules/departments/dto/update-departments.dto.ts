import { PartialType } from '@nestjs/swagger';
import { CreateDepartmentDto } from './create-departments.dto';

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}
