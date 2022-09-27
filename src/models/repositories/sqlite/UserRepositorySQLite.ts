import { IUserRepository } from "@models/repositories/IUserRepository";
import { User } from "@models/User";
import { sqlite3 } from "better-sqlite3";
import { runTransaction } from "../../../util/db/runTransaction";
import * as ISerializable from "@models/repositories/ISerializable";
import { SQLiteTable } from "@models/repositories/sqlite/SQLiteTable";

export class UserRepositorySQLite extends SQLiteTable implements IUserRepository {
  public static readonly tableSchema: string =
    `CREATE TABLE IF NOT EXISTS Users (
        userId       TEXT        NOT NULL PRIMARY KEY,
        username     TEXT UNIQUE NOT NULL CHECK (username == LOWER(username)),
        displayName  TEXT,
        firstName    TEXT        NOT NULL,
        lastName     TEXT        NOT NULL,
        email        TEXT UNIQUE NOT NULL,
        passwordHash TEXT        NOT NULL,
        settings     TEXT CHECK (JSON_VALID(settings) == 1),
        created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`;

  public constructor(db: sqlite3) {
    super(db, UserRepositorySQLite.tableSchema);
  }

  public create(user: User): void {
    const query = `INSERT INTO Users(userId, username, displayName, firstName, lastName, email, passwordHash, settings)
                   VALUES ($userId, LOWER($username), $displayName, $firstName, $lastName, $email, $passwordHash,
                           JSON($settings))`;
    runTransaction(this.db, query, user.serializeToObject());
  }

  public read(userId: string): User | null {
    const query = `SELECT userId, username, displayName, firstName, lastName, email, settings
                   FROM Users
                   WHERE userId = $userId`;
    const row = this.db.prepare(query).get({ userId: userId });

    return (row != null) ? ISerializable.deserialize(User, row) : null;
  }

  public readAll(): User[] {
    const query = `SELECT userId, username, displayName, firstName, lastName, email FROM Users`;
    return this.db.prepare(query).all().map(row => ISerializable.deserialize(User, row));
  }

  public update(user: User): void {
    const query = `UPDATE Users
                   SET username    = LOWER($username),
                       displayName = $displayName,
                       firstName   = $firstName,
                       lastName    = $lastName,
                       ${user.passwordHash != null ? "passwordHash = $passwordHash," : ""}
                       email       = $email,
                       settings    = json($settings)
                   WHERE userId = $userId`;
    runTransaction(this.db, query, user.serializeToObject());
  }

  public delete(user: User): void {
    const query = `DELETE FROM Users WHERE userId = $userId`;
    runTransaction(this.db, query, { userId: user.id });
  }

  public findUsername(username: string): User | null {
    const query = `SELECT userId FROM Users WHERE username = LOWER($username)`;
    const row = this.db.prepare(query).get({ username: username });

    return (row != null) ? this.read(row.userId) : null;
  }

  public checkPassword(user: User, password: string, comparePasswords: (password, passwordHash) => boolean): boolean {
    const query = `SELECT passwordHash FROM Users WHERE userId = $userId`;
    const row = this.db.prepare(query).get({ userId: user.id });
    if (row.length === 0) throw new Error("User not found: no such ID");

    return comparePasswords(password, row.passwordHash);
  }
}
