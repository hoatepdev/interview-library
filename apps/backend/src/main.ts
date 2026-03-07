// Eagerly load .env so process.env is populated before NestJS constructs
// any provider (Passport strategies read process.env in their constructors).
// Check multiple locations because __dirname differs between ts-node (src/)
// and compiled (dist/src/), and cwd is apps/backend/ via pnpm --filter.
import * as path from "path";
import { config } from "dotenv";
config({
  path: [
    path.resolve(process.cwd(), "../../.env"), // apps/backend -> monorepo root
    path.resolve(process.cwd(), ".env"), // if cwd is monorepo root
  ],
});

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import session from "express-session";
import passport from "passport";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        domain: undefined, // Let browser use default (allows localhost access)
      },
      name: "connect.sid", // Explicit cookie name
    }),
  );

  // Passport initialization
  app.use(passport.initialize());
  app.use(passport.session());

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:9000",
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix("api");

  const port = process.env.PORT || 9001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
