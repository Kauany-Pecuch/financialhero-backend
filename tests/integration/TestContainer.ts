import type {Sequelize} from "sequelize-typescript";
import {PostgreSqlContainer, StartedPostgreSqlContainer} from "@testcontainers/postgresql";


/**
 * Classe abstrata para definir config de Test Containers
 */
export abstract class TestContainer {

  protected static container: StartedPostgreSqlContainer;
  protected static sequelize: Sequelize;

  static async setup() {
    this.container = await new PostgreSqlContainer("postgres:16-alpine").start();

    process.env.DB_HOST = this.container.getHost();
    process.env.DB_PORT = String(this.container.getMappedPort(5432));
    process.env.DB_USER = this.container.getUsername();
    process.env.DB_PASSWORD = this.container.getPassword();
    process.env.DB_NAME = this.container.getDatabase();

    const dbModule = await import("../../src/db.js");
    this.sequelize = dbModule.default;

    await this.sequelize.authenticate();
    await this.sequelize.sync({ force: true });
  }

  static async teardown() {
    await this.sequelize?.close();
    await this.container?.stop();
  }
}
