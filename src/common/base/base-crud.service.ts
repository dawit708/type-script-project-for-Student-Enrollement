import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ObjectLiteral, Repository } from 'typeorm';

export class BaseCrudService<T extends ObjectLiteral> {
  constructor(protected repo: Repository<T>, protected relations: any = {}) {}

  findAll() {
    return this.repo.find({ relations: this.relations });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id } as any, relations: this.relations });
    if (!item) throw new NotFoundException('Record not found');
    return item;
  }

  create(data: any) {
    return this.safeSave(this.repo.create(data) as any);
  }

  async update(id: number, data: any) {
    const item = await this.findOne(id);
    Object.assign(item, data);
    return this.safeSave(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    try {
      await this.repo.remove(item);
    } catch (e: any) {
      if (e.code === 'ER_ROW_IS_REFERENCED_2') {
        throw new ConflictException('Cannot delete: this record is used by other data');
      }
      throw e;
    }
    return { message: 'Deleted successfully' };
  }

  private async safeSave(entity: any) {
    try {
      return await this.repo.save(entity);
    } catch (e: any) {
      if (e.code === 'ER_DUP_ENTRY') throw new ConflictException('Record already exists (duplicate value)');
      if (e.code === 'ER_NO_REFERENCED_ROW_2') throw new BadRequestException('Related record does not exist');
      throw e;
    }
  }
}
