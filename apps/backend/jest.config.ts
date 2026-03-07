import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: [
    "**/*.(t|j)s",
    "!**/*.module.ts",
    "!**/main.ts",
    "!**/database/migrations/**",
    "!**/database/seeds/**",
    "!**/database/data-source.ts",
  ],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@interview-library/shared/i18n$":
      "<rootDir>/../../../packages/shared/dist/i18n/index.cjs",
    "^@interview-library/shared$":
      "<rootDir>/../../../packages/shared/dist/index.cjs",
    "^@interview-library/shared/(.*)$":
      "<rootDir>/../../../packages/shared/dist/$1/index.cjs",
  },
};

export default config;
