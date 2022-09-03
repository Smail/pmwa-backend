import sqlite3 from "better-sqlite3";
import { IUserRepository } from "@models/repositories/IUserRepository";
import { UserRepositorySQLite } from "@models/repositories/sqlite/UserRepositorySQLite";
import { ITasksRepository } from "@models/repositories/ITasksRepository";
import { ITagsRepository } from "@models/repositories/ITagsRepository";
import { IRefreshTokenRepository } from "@models/repositories/IRefreshTokenRepository";
import { TasksRepositorySQLite } from "@models/repositories/sqlite/TasksRepositorySQLite";
import { TagsRepositorySQLite } from "@models/repositories/sqlite/TagsRepositorySQLite";
import { RefreshTokenRepositorySQLite } from "@models/repositories/sqlite/RefreshTokenRepositorySQLite";

if (process.env.DEBUG) {
  import("./Mock");
}

if (!process.env.DB_PATH) throw new Error("Missing environment variable DB_PATH");
const dbPath: string = !process.env.DEBUG ? process.env.DB_PATH : ":memory:";
const db = sqlite3(dbPath);

process.on("exit", () => {
  db.close();
});
process.on("SIGHUP", () => process.exit(128 + 1));
process.on("SIGINT", () => process.exit(128 + 2));
process.on("SIGTERM", () => process.exit(128 + 15));

export class Model {
  private static readonly db: sqlite3 = sqlite3(dbPath);
  public static readonly userRepository: IUserRepository = new UserRepositorySQLite(this.db);
  public static readonly tasksRepository: ITasksRepository = new TasksRepositorySQLite(this.db);
  public static readonly tagRepository: ITagsRepository = new TagsRepositorySQLite(this.db);
  public static readonly refreshTokenRepository: IRefreshTokenRepository = new RefreshTokenRepositorySQLite(this.db);
}
