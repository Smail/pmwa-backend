import sqlite3 from "better-sqlite3";
import { IUserRepository } from "@models/IUserRepository";
import { UserRepositorySQLite } from "@models/UserRepositorySQLite";
import { ITasksRepository } from "@models/ITasksRepository";
import { ITagsRepository } from "@models/ITagsRepository";
import { IRefreshTokenRepository } from "@models/IRefreshTokenRepository";
import { TasksRepositorySQLite } from "@models/TasksRepositorySQLite";
import { TagsRepositorySQLite } from "@models/TagsRepositorySQLite";
import { RefreshTokenRepositorySQLite } from "@models/RefreshTokenRepositorySQLite";

export class Model {
  private static readonly db: sqlite3 = sqlite3(process.env.DB_PATH);
  public static readonly userRepository: IUserRepository = new UserRepositorySQLite(this.db);
  public static readonly tasksRepository: ITasksRepository = new TasksRepositorySQLite(this.db);
  public static readonly tagRepository: ITagsRepository = new TagsRepositorySQLite(this.db);
  public static readonly refreshTokenRepository: IRefreshTokenRepository = new RefreshTokenRepositorySQLite(this.db);
}
