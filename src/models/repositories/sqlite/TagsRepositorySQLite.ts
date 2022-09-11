import { sqlite3 } from "better-sqlite3";
import { ITagsRepository } from "@models/repositories/ITagsRepository";
import { Tag } from "@models/Tag";
import * as ISerializable from "@models/repositories/ISerializable";
import { runTransaction } from "../../../util/db/runTransaction";
import { SQLiteTable } from "@models/repositories/sqlite/SQLiteTable";

export class TagsRepositorySQLite extends SQLiteTable implements ITagsRepository {
  public static readonly tableSchema: string =
    `CREATE TABLE IF NOT EXISTS Tags (
        tagId      TEXT      NOT NULL PRIMARY KEY,
        name       TEXT      NOT NULL,
        color      TEXT      NOT NULL DEFAULT 'red',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (name, color) ON CONFLICT ROLLBACK
    )`;

  public constructor(db: sqlite3) {
    super(db, TagsRepositorySQLite.tableSchema);
  }

  public create(tag: Tag): void {
    const queryNoColor = `INSERT INTO Tags(tagId, name) VALUES ($tagId, $name)`;
    const queryColor = `INSERT INTO Tags(tagId, name, color) VALUES ($tagId, $name, $color)`;
    runTransaction(this.db, (tag.color != null ? queryColor : queryNoColor), tag.serializeToObject());
  }

  public read(tagId: string): Tag | null {
    const query = `SELECT * FROM Tags WHERE tagId = $tagId`;
    const row = this.db.prepare(query).get({ tagId: tagId });

    return (row != null) ? ISerializable.deserialize(Tag, row) : null;
  }

  public readAll(): Tag[] {
    const query = `SELECT * FROM Tags`;
    return this.db.prepare(query).all().map(row => ISerializable.deserialize(Tag, row));
  }

  public update(tag: Tag): void {
    const query = `UPDATE Tags SET name = $name, color = $color WHERE tagId = $tagId`;
    runTransaction(this.db, query, { tagId: tag.tagId });
  }

  public delete(tag: Tag): void {
    const query = `DELETE FROM Tags WHERE tagId = $tagId`;
    runTransaction(this.db, query, { tagId: tag.tagId });
  }
}
