import { Module, Global } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DomainEvent } from "../../database/entities/domain-event.entity";
import { DomainEventService } from "./domain-event.service";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([DomainEvent])],
  providers: [DomainEventService],
  exports: [DomainEventService],
})
export class DomainEventModule {}
