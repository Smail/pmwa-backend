import { sqlite3 } from "better-sqlite3";

export abstract class SQLiteTable {
  protected readonly db: sqlite3;

  protected constructor(db: sqlite3, tableSchema: string) {
    this.db = db;
    this.db.prepare(tableSchema).run();
  }
}
