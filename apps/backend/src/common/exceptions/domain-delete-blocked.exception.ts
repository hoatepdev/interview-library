import { ConflictException } from "@nestjs/common";

export class DomainDeleteBlockedException extends ConflictException {
  constructor(
    entityType: string,
    entityId: string,
    reason: string,
    childCount: number,
  ) {
    super({
      statusCode: 409,
      error: "Delete Blocked",
      message: `Cannot delete ${entityType} (${entityId}): ${reason}. Use force=true to cascade soft-delete ${childCount} child record(s).`,
      entityType,
      entityId,
      childCount,
    });
  }
}
