import { DataSource } from "typeorm";
import { dataSourceOptions } from "./data-source";

async function runMigrations() {
  const dataSource = new DataSource(dataSourceOptions);
  try {
    await dataSource.initialize();
    console.log("Database connection established");

    console.log("Running migrations...");
    await dataSource.runMigrations();
    console.log("Migrations completed successfully");

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("Error running migrations:", error);
    await dataSource.destroy();
    process.exit(1);
  }
}

runMigrations();
