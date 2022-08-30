import { IUserRepository } from "@models/IUserRepository";
import { User } from "@models/User";
import { sqlite3 } from "better-sqlite3";
import { runTransaction } from "../util/db/runTransaction";
import * as ISerializable from "@models/ISerializable";
import { ISQLiteTable } from "@models/ISQLiteTable";

export class UserRepositorySQLite implements IUserRepository {
  public static readonly table: ISQLiteTable = {
    table(): string {
      return `CREATE TABLE IF NOT EXISTS users (
        uuid         TEXT PRIMARY KEY,
        username     TEXT UNIQUE NOT NULL,
        displayName  TEXT,
        firstName    TEXT        NOT NULL,
        lastName     TEXT        NOT NULL,
        email        TEXT UNIQUE NOT NULL,
        passwordHash TEXT        NOT NULL,
        created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
      )

      -- TODO constraint lowercase username`;
    },
  };
  private readonly db: sqlite3;

  public constructor(db: sqlite3) {
    this.db = db;
  }

  public create(user: User): void {
    const query = `INSERT INTO users(uuid, username, displayName, firstName, lastName, email, passwordHash)
                   VALUES ($userId, $username, $displayName, $firstName, $lastName, $email, $passwordHash)`;
    runTransaction(this.db, query, user.serializeToObject());
  }

  public read(userId: string): User {
    const query = `SELECT uuid AS id, username, displayName, firstName, lastName, email
                   FROM users
                   WHERE uuid = $userId`;
    return ISerializable.deserialize(User, this.db.prepare(query).get({ userId: userId }));
  }

  public update(user: User): void {
    const query = `UPDATE users
                   SET username     = $username,
                       displayName  = $displayName,
                       firstName    = $firstName,
                       lastName     = $lastName,
                       passwordHash = $passwordHash,
                       email        = $email
                   WHERE uuid = $userId`;
    runTransaction(this.db, query, user.serializeToObject());
  }

  public delete(user: User): void {
    const query = `DELETE FROM users WHERE uuid = $userId`;
    runTransaction(this.db, query, { userId: user.id });
  }

  public findUsername(username: string): User | null {
    const query = `SELECT uuid as id FROM users WHERE username = $username`;
    const row = this.db.prepare(query).get({ username: username });

    // TODO assert row.length === 1
    return (row.length > 0) ? this.read(row.id) : null;
  }
}
