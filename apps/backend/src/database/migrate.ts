import "reflect-metadata";
import dataSource from "./data-source";

dataSource
  .initialize()
  .then(async () => {
    console.log("Running migrations...");
    await dataSource.runMigrations();
    console.log("Migrations completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during migration:", error);
    process.exit(1);
  });
