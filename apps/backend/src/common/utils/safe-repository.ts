import {
  Repository,
  FindManyOptions,
  FindOneOptions,
  ObjectLiteral,
} from "typeorm";

/**
 * SafeRepository wraps a TypeORM Repository to enforce soft-delete safety.
 *
 * By default, TypeORM already excludes soft-deleted rows from queries
 * (via @DeleteDateColumn). This wrapper adds an additional guard:
 * it prevents calling withDeleted queries unless an explicit admin
 * context flag is set.
 *
 * Usage in services:
 *   const safeRepo = new SafeRepository(this.questionRepository);
 *   safeRepo.find({ where: { topicId } }); // only active rows
 *   safeRepo.findIncludingDeleted({ where: { id } }); // admin context
 */
export class SafeRepository<T extends ObjectLiteral> {
  constructor(private readonly repository: Repository<T>) {}

  async find(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(this.stripWithDeleted(options));
  }

  async findOne(options?: FindOneOptions<T>): Promise<T | null> {
    return this.repository.findOne(this.stripWithDeleted(options));
  }

  /**
   * Explicitly opt into including soft-deleted rows.
   * Only use this in admin-context code paths.
   */
  async findIncludingDeleted(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find({ ...options, withDeleted: true });
  }

  async findOneIncludingDeleted(
    options?: FindOneOptions<T>,
  ): Promise<T | null> {
    return this.repository.findOne({ ...options, withDeleted: true });
  }

  get inner(): Repository<T> {
    return this.repository;
  }

  private stripWithDeleted<O extends FindManyOptions<T> | FindOneOptions<T>>(
    options?: O,
  ): O {
    if (!options) return options;
    const { withDeleted, ...rest } = options as any;
    if (withDeleted) {
      console.warn(
        "[SafeRepository] withDeleted=true was stripped from a non-admin query. " +
          "Use findIncludingDeleted() or findOneIncludingDeleted() for admin context.",
      );
    }
    return rest as O;
  }
}
