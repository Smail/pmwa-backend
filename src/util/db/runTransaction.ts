import { sqlite3 } from "better-sqlite3";

export function runTransaction(db: sqlite3, query: string, bindings: Object, expectedEdits: number = 1) {
  db.transaction(() => {
    const stmt = db.prepare(query);
    const info = stmt.run(bindings);
    if (info.changes !== expectedEdits) {
      throw new Error(`Expected ${expectedEdits} edited rows, but got ${info.changes}`);
    }
  });
}
