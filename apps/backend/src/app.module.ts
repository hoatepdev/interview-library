import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as path from "path";
import { TopicsModule } from "./topics/topics.module";
import { QuestionsModule } from "./questions/questions.module";
import { PracticeModule } from "./practice/practice.module";
import { I18nModule } from "./i18n/i18n.module";
import { TranslationModule } from "./translations/translation.module";
import { AuthModule } from "./auth/auth.module";
import { ReviewModule } from "./review/review.module";
import { AdminModule } from "./admin/admin.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.join(__dirname, "../../../.env"),
    }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      username: process.env.DB_USERNAME || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_NAME || "interview_library",
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      migrations: [__dirname + "/database/migrations/*{.ts,.js}"],
      synchronize: false, // Use migrations in production
      logging: process.env.NODE_ENV === "development",
    }),
    AuthModule,
    I18nModule,
    TranslationModule,
    TopicsModule,
    QuestionsModule,
    PracticeModule,
    ReviewModule,
    AdminModule,
  ],
})
export class AppModule {}
