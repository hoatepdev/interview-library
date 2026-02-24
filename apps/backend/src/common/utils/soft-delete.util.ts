import { Repository, IsNull, Not } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

export interface SoftDeletable {
  id: string;
  deletedAt: Date;
  deletedBy: string;
}

export async function softDelete<T extends SoftDeletable>(
  repository: Repository<T>,
  id: string,
  deletedByUserId: string,
): Promise<void> {
  const entity = await repository.findOne({ where: { id } as any });
  if (!entity) {
    throw new NotFoundException(`Entity with ID ${id} not found`);
  }

  entity.deletedBy = deletedByUserId;
  await repository.save(entity);
  await repository.softRemove(entity);
}

export async function restore<T extends SoftDeletable>(
  repository: Repository<T>,
  id: string,
): Promise<T> {
  const entity = await repository.findOne({
    where: { id, deletedAt: Not(IsNull()) } as any,
    withDeleted: true,
  });
  if (!entity) {
    throw new NotFoundException(`Deleted entity with ID ${id} not found`);
  }

  entity.deletedBy = null;
  await repository.recover(entity);
  return repository.findOne({ where: { id } as any });
}

export async function findWithDeleted<T extends SoftDeletable>(
  repository: Repository<T>,
  id: string,
): Promise<T> {
  const entity = await repository.findOne({
    where: { id } as any,
    withDeleted: true,
  });
  if (!entity) {
    throw new NotFoundException(`Entity with ID ${id} not found`);
  }
  return entity;
}
