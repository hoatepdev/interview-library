import { ConflictException } from '@nestjs/common';

export class RestoreBlockedException extends ConflictException {
  constructor(
    entityType: string,
    entityId: string,
    parentType: string,
    parentId: string,
  ) {
    super({
      statusCode: 409,
      error: 'Restore Blocked',
      message: `Cannot restore ${entityType} (${entityId}): parent ${parentType} (${parentId}) is soft-deleted. Restore the parent first.`,
      entityType,
      entityId,
      parentType,
      parentId,
    });
  }
}
