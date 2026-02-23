import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1771845985469 implements MigrationInterface {
    name = 'InitialSchema1771845985469'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "topic_translations" ("id" BIGSERIAL NOT NULL, "topic_id" uuid NOT NULL, "locale" character varying(5) NOT NULL, "name" character varying(100) NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2706b8bfbdeabe7a90e2fb73ec3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2062b496508bc3547531a76239" ON "topic_translations" ("locale") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4e862c0f575adafc6a9030d975" ON "topic_translations" ("topic_id", "locale") `);
        await queryRunner.query(`CREATE TABLE "question_translations" ("id" BIGSERIAL NOT NULL, "question_id" uuid NOT NULL, "locale" character varying(5) NOT NULL, "title" character varying(255) NOT NULL, "content" text NOT NULL, "answer" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9e2ec95933922f5c7a43de96d03" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3bddf2aa22a092dcad615d9ddb" ON "question_translations" ("locale") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b530665e62ed5680a75cbf134e" ON "question_translations" ("question_id", "locale") `);
        await queryRunner.query(`CREATE TABLE "user_questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "question_id" uuid NOT NULL, "is_public" boolean NOT NULL DEFAULT false, "is_favorite" boolean NOT NULL DEFAULT false, "next_review_at" TIMESTAMP, "ease_factor" numeric(4,2) NOT NULL DEFAULT '2.5', "interval_days" integer NOT NULL DEFAULT '0', "repetitions" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a1612c08faf3e08d2fd56e9d33f" UNIQUE ("user_id", "question_id"), CONSTRAINT "PK_57bcdfc90c43f8b16813b7687a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."practice_logs_self_rating_enum" AS ENUM('poor', 'fair', 'good', 'great')`);
        await queryRunner.query(`CREATE TABLE "practice_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "question_id" uuid NOT NULL, "user_id" uuid, "self_rating" "public"."practice_logs_self_rating_enum" NOT NULL, "time_spent_seconds" integer, "notes" text, "practiced_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d9fd7ffa2015a9f74bc6b043256" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "name" character varying, "avatar" character varying, "provider" character varying NOT NULL DEFAULT 'google', "provider_id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_6425135effde2ab8322f8464932" UNIQUE ("provider_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."questions_level_enum" AS ENUM('junior', 'middle', 'senior')`);
        await queryRunner.query(`CREATE TYPE "public"."questions_status_enum" AS ENUM('new', 'learning', 'mastered')`);
        await queryRunner.query(`CREATE TABLE "questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "content" text NOT NULL, "answer" text, "topic_id" uuid NOT NULL, "level" "public"."questions_level_enum" NOT NULL DEFAULT 'middle', "status" "public"."questions_status_enum" NOT NULL DEFAULT 'new', "user_id" uuid, "difficulty_score" integer NOT NULL DEFAULT '0', "practice_count" integer NOT NULL DEFAULT '0', "last_practiced_at" TIMESTAMP, "next_review_at" TIMESTAMP, "ease_factor" numeric(4,2) NOT NULL DEFAULT '2.5', "interval_days" integer NOT NULL DEFAULT '0', "repetitions" integer NOT NULL DEFAULT '0', "order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "topics" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "slug" character varying(100) NOT NULL, "color" character varying(7), "icon" character varying(50), "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97c66ab0029f49fde30517f8199" UNIQUE ("slug"), CONSTRAINT "PK_e4aa99a3fa60ec3a37d1fc4e853" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "topic_translations" ADD CONSTRAINT "FK_8b60e14fa5f4dfab0dd3c0a1ae0" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question_translations" ADD CONSTRAINT "FK_d75f04dea96ed72c62407be69c8" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_questions" ADD CONSTRAINT "FK_7df0da6b1f94c132a9fbed5155c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_questions" ADD CONSTRAINT "FK_d253957ec0f958b71ddc6881f06" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "practice_logs" ADD CONSTRAINT "FK_b8287c05e7ed7473687ca541bc0" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "practice_logs" ADD CONSTRAINT "FK_55e31a1c49a95a4f85093b089a8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_e29a77ea64df3fb567c4c200a9e" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_5800cd25a5888174b2c40e67d4b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_5800cd25a5888174b2c40e67d4b"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_e29a77ea64df3fb567c4c200a9e"`);
        await queryRunner.query(`ALTER TABLE "practice_logs" DROP CONSTRAINT "FK_55e31a1c49a95a4f85093b089a8"`);
        await queryRunner.query(`ALTER TABLE "practice_logs" DROP CONSTRAINT "FK_b8287c05e7ed7473687ca541bc0"`);
        await queryRunner.query(`ALTER TABLE "user_questions" DROP CONSTRAINT "FK_d253957ec0f958b71ddc6881f06"`);
        await queryRunner.query(`ALTER TABLE "user_questions" DROP CONSTRAINT "FK_7df0da6b1f94c132a9fbed5155c"`);
        await queryRunner.query(`ALTER TABLE "question_translations" DROP CONSTRAINT "FK_d75f04dea96ed72c62407be69c8"`);
        await queryRunner.query(`ALTER TABLE "topic_translations" DROP CONSTRAINT "FK_8b60e14fa5f4dfab0dd3c0a1ae0"`);
        await queryRunner.query(`DROP TABLE "topics"`);
        await queryRunner.query(`DROP TABLE "questions"`);
        await queryRunner.query(`DROP TYPE "public"."questions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."questions_level_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "practice_logs"`);
        await queryRunner.query(`DROP TYPE "public"."practice_logs_self_rating_enum"`);
        await queryRunner.query(`DROP TABLE "user_questions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b530665e62ed5680a75cbf134e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3bddf2aa22a092dcad615d9ddb"`);
        await queryRunner.query(`DROP TABLE "question_translations"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4e862c0f575adafc6a9030d975"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2062b496508bc3547531a76239"`);
        await queryRunner.query(`DROP TABLE "topic_translations"`);
    }

}
