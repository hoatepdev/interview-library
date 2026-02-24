import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { I18nService } from "./i18n.service";
import { TranslationService } from "./translation.service";
import { I18nMiddleware } from "./i18n.middleware";

@Module({
  providers: [I18nService, TranslationService],
  exports: [I18nService, TranslationService],
})
export class I18nModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(I18nMiddleware).forRoutes("*");
  }
}
