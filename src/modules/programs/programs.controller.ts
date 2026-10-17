import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create-programs.dto';
import { UpdateProgramDto } from './dto/update-programs.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('programs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgramsController {
  constructor(private service: ProgramsService) {}

  @Get() findAll() { return this.service.findAll(); }

  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Roles('admin') @Post() create(@Body() dto: CreateProgramDto) { return this.service.create(dto); }

  @Roles('admin') @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProgramDto) { return this.service.update(id, dto); }

  @Roles('admin') @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
