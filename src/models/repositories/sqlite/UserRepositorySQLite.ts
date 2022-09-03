import { IUserRepository } from "@models/repositories/IUserRepository";
import { User } from "@models/User";
import { sqlite3 } from "better-sqlite3";
import { runTransaction } from "../../../util/db/runTransaction";
import * as ISerializable from "@models/repositories/ISerializable";
import { Token } from "@models/Token";
import { IRefreshTokenRepository } from "../IRefreshTokenRepository";
import { SQLiteTable } from "@models/repositories/sqlite/SQLiteTable";

export class UserRepositorySQLite extends SQLiteTable implements IUserRepository {
  public static readonly tableSchema: string =
    `CREATE TABLE IF NOT EXISTS users (
        uuid         TEXT PRIMARY KEY,
        username     TEXT UNIQUE NOT NULL CHECK (username == lower(username)),
        displayName  TEXT,
        firstName    TEXT        NOT NULL,
        lastName     TEXT        NOT NULL,
        email        TEXT UNIQUE NOT NULL,
        passwordHash TEXT        NOT NULL,
        created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`;

  public constructor(db: sqlite3) {
    super(db, UserRepositorySQLite.tableSchema);
  }

  public readAll(): User[] {
    const query = `SELECT uuid AS id, username, displayName, firstName, lastName, email FROM users`;
    return this.db.prepare(query).all().map(row => ISerializable.deserialize(User, row));
  }

  public getTokens(user: User, refreshTokenRepository: IRefreshTokenRepository): Token[] {
    throw new Error("Method not implemented.");
  }

  public create(user: User): void {
    const query = `INSERT INTO users(uuid, username, displayName, firstName, lastName, email, passwordHash)
                   VALUES ($userId, lower($username), $displayName, $firstName, $lastName, $email, $passwordHash)`;
    runTransaction(this.db, query, user.serializeToObject());
  }

  public read(userId: string): User {
    const query = `SELECT uuid AS id, username, displayName, firstName, lastName, email
                   FROM users
                   WHERE uuid = $userId`;
    const row = this.db.prepare(query).get({ userId: userId });
    if (row.length === 0) throw new Error("User not found: no such ID");

    return ISerializable.deserialize(User, row);
  }

  public update(user: User): void {
    const query = `UPDATE users
                   SET username     = lower($username),
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
    const query = `SELECT uuid AS id FROM users WHERE username = lower($username)`;
    const row = this.db.prepare(query).get({ username: username });

    return (row != null) ? this.read(row.id) : null;
  }

  public checkPassword(user: User, password: string, comparePasswords: (password, passwordHash) => boolean): boolean {
    const query = `SELECT passwordHash FROM users WHERE uuid = $userId`;
    const row = this.db.prepare(query).get({ userId: user.id });
    if (row.length === 0) throw new Error("User not found: no such ID");

    return comparePasswords(password, row.passwordHash);
  }
}
