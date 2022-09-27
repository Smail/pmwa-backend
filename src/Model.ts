import sqlite3 from "better-sqlite3";
import { IUserRepository } from "@models/repositories/IUserRepository";
import { UserRepositorySQLite } from "@models/repositories/sqlite/UserRepositorySQLite";
import { ITasksRepository } from "@models/repositories/ITasksRepository";
import { ITagsRepository } from "@models/repositories/ITagsRepository";
import { ITokenRepository } from "@models/repositories/ITokenRepository";
import { TasksRepositorySQLite } from "@models/repositories/sqlite/TasksRepositorySQLite";
import { TagsRepositorySQLite } from "@models/repositories/sqlite/TagsRepositorySQLite";
import { TokenRepositorySQLite } from "@models/repositories/sqlite/TokenRepositorySQLite";

let dbPath: string;
if (process.env.DEBUG) {
  import("./Mock");
  if (!process.env.DEBUG_DB_PATH) throw new Error("Missing environment variable DEBUG_DB_PATH");
  dbPath = process.env.DEBUG_DB_PATH;
} else {
  if (!process.env.DB_PATH) throw new Error("Missing environment variable DB_PATH");
  dbPath = process.env.DB_PATH;
}

const db = sqlite3(dbPath);
db.pragma("foreign_keys = ON");

process.on("exit", () => db.close());
process.on("SIGHUP", () => process.exit(128 + 1));
process.on("SIGINT", () => process.exit(128 + 2));
process.on("SIGTERM", () => process.exit(128 + 15));

export class Model {
  public static readonly db: sqlite3 = sqlite3(dbPath);
  public static readonly userRepository: IUserRepository = new UserRepositorySQLite(Model.db);
  public static readonly tasksRepository: ITasksRepository = new TasksRepositorySQLite(Model.db);
  public static readonly tagRepository: ITagsRepository = new TagsRepositorySQLite(Model.db);
  public static readonly refreshTokenRepository: ITokenRepository = new TokenRepositorySQLite(Model.db);
}
