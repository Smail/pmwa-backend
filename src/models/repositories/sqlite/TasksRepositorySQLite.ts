import { ITasksRepository } from "@models/repositories/ITasksRepository";
import { Task } from "@models/Task";
import { sqlite3 } from "better-sqlite3";
import { runTransaction } from "../../../util/db/runTransaction";
import * as ISerializable from "@models/repositories/ISerializable";
import { SQLiteTable } from "@models/repositories/sqlite/SQLiteTable";
import { ITaskRecord } from "@models/ITaskRecord";

export class TasksRepositorySQLite extends SQLiteTable implements ITasksRepository {
  public static readonly tableSchema: string =
    `CREATE TABLE IF NOT EXISTS Tasks (
        taskId     TEXT      NOT NULL PRIMARY KEY,
        name       TEXT      NOT NULL,
        content    TEXT,
        isDone     INT                DEFAULT 0 NOT NULL CHECK (isDone == 0 OR isDone == 1),
        startDate  TEXT,
        endDate    TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CHECK ((startDate IS NULL AND endDate IS NULL) OR (startDate IS NOT NULL AND endDate IS NOT NULL))
    )`;

  public constructor(db: sqlite3) {
    super(db, TasksRepositorySQLite.tableSchema);
  }

  public static serializeToSQLiteCompatible(obj: ITaskRecord) {
    return {
      ...obj,
      isDone: obj.isDone ? 1 : 0,
      startDate: obj.startDate != null ? obj.startDate.toJSON() : null,
      endDate: obj.endDate != null ? obj.endDate.toJSON() : null,
    };
  }

  public static deserializeFromSQLiteCompatible(obj: {
    taskId: string, name: string, content: string | null, isDone: number | boolean,
    startDate: string | null, endDate: string | null,
  }) {
    // TODO make these ifs assertions, because this should be consistent in the database
    if (typeof obj.isDone !== "boolean" && obj.isDone !== 0 && obj.isDone !== 1) {
      throw new Error(`Invalid state: isDone is neither 0 or 1. It's '${obj.isDone}'`);
    }

    const startDate = obj.startDate != null ? new Date(obj.startDate) : null;
    const endDate = obj.endDate != null ? new Date(obj.endDate) : null;

    if (obj.startDate != null && obj.endDate == null) throw Error("Null/not null mismatch: startDate is not null");
    if (obj.endDate != null && obj.startDate == null) throw Error("Null/not null mismatch: endDate is not null");

    // startDate should be a Date object, i.e., not null.
    // It only becomes null if obj.startDate is not a valid date string
    if (obj.startDate != null && startDate == null) {
      throw Error(`Invalid argument: date string '${obj.startDate}' is invalid.` +
        "Check if it wrapped too many times in string characters");
    }
    if (obj.endDate != null && endDate == null) {
      throw Error(`Invalid argument: date string '${obj.endDate}' is invalid.` +
        "Check if it wrapped too many times in string characters");
    }

    return {
      ...obj,
      isDone: obj.isDone === 1,
      startDate,
      endDate,
    };
  }

  public create(task: Task): void {
    const query = `INSERT INTO Tasks(taskId, name, content, isDone, startDate, endDate)
                   VALUES ($taskId, $name, $content, $isDone, $startDate, $endDate)`;
    runTransaction(this.db, query, TasksRepositorySQLite.serializeToSQLiteCompatible(task.serializeToObject()));
  }

  public read(taskId: string): Task | null {
    const query = `SELECT * FROM Tasks WHERE taskId = $taskId`;
    const row = this.db.prepare(query).get({ taskId: taskId });

    if (row == null) return null;
    return ISerializable.deserialize(Task, TasksRepositorySQLite.deserializeFromSQLiteCompatible(row));
  }

  public readAll(): Task[] {
    const query = `SELECT * FROM Tasks`;
    return this.db.prepare(query)
      .all()
      .map(row => TasksRepositorySQLite.deserializeFromSQLiteCompatible(row))
      .map(row => ISerializable.deserialize(Task, row));
  }

  public update(task: Task): void {
    const query = `UPDATE Tasks
                   SET name      = $name,
                       content   = $content,
                       isDone    = $isDone,
                       startDate = $startDate,
                       endDate   = $endDate
                   WHERE taskId = $taskId`;
    runTransaction(this.db, query, TasksRepositorySQLite.serializeToSQLiteCompatible(task.serializeToObject()));
  }

  public delete(task: Task): void {
    const query = `DELETE FROM Tasks WHERE taskId = $taskId`;
    runTransaction(this.db, query, { taskId: task.id });
  }
}
