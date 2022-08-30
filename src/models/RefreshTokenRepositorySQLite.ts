import { IRefreshTokenRepository } from "@models/IRefreshTokenRepository";
import { EncryptedToken } from "@models/EncryptedToken";
import { ISQLiteTable } from "@models/ISQLiteTable";
import { sqlite3 } from "better-sqlite3";
import * as ISerializable from "@models/ISerializable";
import { runTransaction } from "../util/db/runTransaction";

export class RefreshTokenRepositorySQLite implements IRefreshTokenRepository {
  public static readonly table: ISQLiteTable = {
    table(): string {
      return `CREATE TABLE IF NOT EXISTS refreshTokens (
        uuid        TEXT UNIQUE NOT NULL,
        userUuid    TEXT        NOT NULL,
        tokenCipher TEXT UNIQUE NOT NULL,
        created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (uuid, userUuid),
        FOREIGN KEY (userUuid) REFERENCES users (uuid)
      )`;
    },
  };
  private readonly db: sqlite3;

  public constructor(db: sqlite3) {
    this.db = db;
  }

  public create(refreshToken: EncryptedToken): void {
    const query = `INSERT INTO refreshTokens (uuid, tokenCipher, userUuid) VALUES ($id, $tokenCipher, $userId)`;
    runTransaction(this.db, query, refreshToken.serializeToObject());
  }

  public read(refreshTokenId: string): EncryptedToken {
    const query = `SELECT uuid AS taskId, userUuid AS userId, tokenCipher FROM refreshTokens WHERE uuid = $id`;
    return ISerializable.deserialize(EncryptedToken, this.db.prepare(query).get({ id: refreshTokenId }));
  }

  public update(refreshToken: EncryptedToken): void {
    throw new Error("Updating refresh tokens is forbidden. Delete and create a new one");
  }

  public delete(refreshToken: EncryptedToken): void {
    const query = `DELETE FROM refreshTokens WHERE uuid = $id`;
    runTransaction(this.db, query, { id: refreshToken.id });
  }
}
