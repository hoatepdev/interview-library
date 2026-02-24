import { ConflictException } from "@nestjs/common";

export class DomainConflictException extends ConflictException {
  constructor(
    entityType: string,
    entityId: string,
    conflictField: string,
    conflictValue: string,
  ) {
    super({
      statusCode: 409,
      error: "Domain Conflict",
      message: `Cannot restore ${entityType} (${entityId}): an active ${entityType} already exists with ${conflictField} = "${conflictValue}"`,
      entityType,
      entityId,
      conflictField,
      conflictValue,
    });
  }
}
