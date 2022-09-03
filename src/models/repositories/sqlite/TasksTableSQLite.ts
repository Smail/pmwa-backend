import { ISQLiteTable } from "@models/ISQLiteTable";

class TasksTableSQLite implements ISQLiteTable {
  private readonly db;

  public constructor(db) {
    this.db = db;
  }

  public table(): string {
    return `CREATE TABLE IF NOT EXISTS tasks (
        uuid       TEXT PRIMARY KEY NOT NULL,
        userUuid   TEXT             NOT NULL,
        name       TEXT             NOT NULL,
        content    TEXT,
        isDone     INT                       DEFAULT 0 NOT NULL CHECK ( isDone == 0 OR isDone == 1),
        created_at TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userUuid) REFERENCES users (uuid) ON UPDATE CASCADE ON DELETE CASCADE
    )`;
  }

  public create(): void {
    this.db.prepare(this.table()).run();
  }
}
