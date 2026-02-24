import { Repository, IsNull, Not, EntityManager } from "typeorm";
import { NotFoundException } from "@nestjs/common";
import { DomainEventService } from "../services/domain-event.service";
import { DomainEventAction } from "../../database/entities/domain-event.entity";
import { RestoreBlockedException } from "../exceptions/restore-blocked.exception";
import { DomainConflictException } from "../exceptions/domain-conflict.exception";

export interface SoftDeletable {
  id: string;
  deletedAt: Date;
  deletedBy: string;
}

/**
 * Parent reference for restore validation.
 * Before restoring an entity, each declared parent is checked to ensure
 * it is not itself soft-deleted.
 */
export interface ParentRef {
  repository: Repository<SoftDeletable>;
  foreignKey: string; // field name on the child entity, e.g. 'topicId'
  parentType: string; // label for error messages, e.g. 'topic'
}

/**
 * Uniqueness constraint for restore conflict detection.
 * Before restoring, the system checks whether an active (non-deleted) row
 * already occupies the unique slot the restored row would claim.
 */
export interface UniqueConstraint {
  fields: string[];
  label: string; // human-readable, e.g. 'slug'
}

// ─── Core soft delete (supports optional EntityManager for transactions) ───

export async function softDelete<T extends SoftDeletable>(
  repository: Repository<T>,
  id: string,
  deletedByUserId: string,
  manager?: EntityManager,
): Promise<void> {
  const repo = manager
    ? manager.getRepository<T>(repository.target as any)
    : repository;

  const entity = await repo.findOne({ where: { id } as any });
  if (!entity) {
    throw new NotFoundException(`Entity with ID ${id} not found`);
  }

  entity.deletedBy = deletedByUserId;
  await repo.save(entity);
  await repo.softRemove(entity);
}

// ─── Restore with parent validation and conflict detection ───

export interface RestoreOptions {
  /** Parent entities that must be active for this restore to proceed */
  parentRefs?: ParentRef[];
  /** Unique constraints to check before restoring */
  uniqueConstraints?: UniqueConstraint[];
  /** Entity type label for audit logging */
  entityType?: string;
  /** ID of the user performing the restore */
  actorId?: string;
  /** Injected service for audit logging */
  domainEventService?: DomainEventService;
}

export async function restore<T extends SoftDeletable>(
  repository: Repository<T>,
  id: string,
  options?: RestoreOptions,
): Promise<T> {
  const entity = await repository.findOne({
    where: { id, deletedAt: Not(IsNull()) } as any,
    withDeleted: true,
  });
  if (!entity) {
    throw new NotFoundException(`Deleted entity with ID ${id} not found`);
  }

  const entityType = options?.entityType ?? repository.metadata.tableName;

  // ─── Part 1: Validate parents are not soft-deleted ───
  if (options?.parentRefs) {
    for (const parentRef of options.parentRefs) {
      const parentId = (entity as any)[parentRef.foreignKey];
      if (!parentId) continue;

      const parent = await parentRef.repository.findOne({
        where: { id: parentId } as any,
        withDeleted: true,
      });

      if (!parent || parent.deletedAt) {
        throw new RestoreBlockedException(
          entityType,
          id,
          parentRef.parentType,
          parentId,
        );
      }
    }
  }

  // ─── Part 3: Check for unique index conflicts before restoring ───
  if (options?.uniqueConstraints) {
    for (const constraint of options.uniqueConstraints) {
      const where: any = {};
      for (const field of constraint.fields) {
        where[field] = (entity as any)[field];
      }

      // This queries only active rows (TypeORM excludes soft-deleted by default)
      const conflicting = await repository.findOne({ where });
      if (conflicting && conflicting.id !== id) {
        const conflictValue = constraint.fields
          .map((f) => (entity as any)[f])
          .join(", ");
        throw new DomainConflictException(
          entityType,
          id,
          constraint.label,
          conflictValue,
        );
      }
    }
  }

  // ─── Perform restore ───
  entity.deletedBy = null;
  await repository.recover(entity);

  // ─── Part 5: Audit log ───
  if (options?.domainEventService) {
    await options.domainEventService.log(
      entityType,
      id,
      DomainEventAction.RESTORED,
      options.actorId ?? null,
      { restoredAt: new Date().toISOString() },
    );
  }

  return repository.findOne({ where: { id } as any });
}

// ─── Find with deleted (admin context only) ───

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
