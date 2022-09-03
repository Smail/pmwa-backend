import CryptoJS from "crypto-js";
import { IRefreshTokenRepository } from "@models/repositories/IRefreshTokenRepository";
import { Token } from "@models/Token";
import { sqlite3 } from "better-sqlite3";
import * as ISerializable from "@models/repositories/ISerializable";
import { runTransaction } from "../../../util/db/runTransaction";
import { User } from "@models/User";
import { SQLiteTable } from "@models/repositories/sqlite/SQLiteTable";

export class RefreshTokenRepositorySQLite extends SQLiteTable implements IRefreshTokenRepository {
  public static readonly tableSchema: string =
    `CREATE TABLE IF NOT EXISTS refreshTokens (
        uuid        TEXT UNIQUE NOT NULL,
        userUuid    TEXT        NOT NULL,
        tokenCipher TEXT UNIQUE NOT NULL,
        created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (uuid, userUuid),
        FOREIGN KEY (userUuid) REFERENCES users (uuid)
    )`;

  public constructor(db: sqlite3) {
    super(db, RefreshTokenRepositorySQLite.tableSchema);
    if (!process.env.AES_KEY) throw new Error("Missing environment variable AES_KEY");
  }

  private static encryptToken(token: string): string {
    if (!process.env.AES_KEY) throw new Error("Missing environment variable AES_KEY");
    return CryptoJS.AES.encrypt(token, process.env.AES_KEY).toString();
  }

  private static decryptToken(tokenCipher: string): string {
    if (!process.env.AES_KEY) throw new Error("Missing environment variable AES_KEY");
    return CryptoJS.AES.decrypt(tokenCipher, process.env.AES_KEY).toString(CryptoJS.enc.Utf8);
  }

  public create(token: Token): void {
    if (token.payload == null) throw new Error("Token payload is null");
    if (!token.payload.hasOwnProperty("userId")) throw new Error("Missing user ID in token payload");
    if (!User.isValidId(token.payload["userId"])) throw new Error("Invalid user ID");
    const query = `INSERT INTO refreshTokens (uuid, tokenCipher, userUuid) VALUES ($tokenId, $tokenCipher, $userId)`;
    const tokenCipher = RefreshTokenRepositorySQLite.encryptToken(token.encoding);

    runTransaction(this.db, query, { tokenId: token.id, userId: token.payload["userId"], tokenCipher: tokenCipher });
  }

  public read(tokenId: string): Token {
    const query = `SELECT uuid AS taskId, userUuid AS userId, tokenCipher FROM refreshTokens WHERE uuid = $tokenId`;
    const row = this.db.prepare(query).get({ tokenId: tokenId });
    if (row.length != 1) throw new Error(`Invalid row length. Expected 1, got ${row.length}`);
    const encoding = RefreshTokenRepositorySQLite.decryptToken(row.tokenCipher);

    return ISerializable.deserialize(Token, { encoding: encoding });
  }

  public readAll(): Token[] {
    const query = `SELECT uuid AS taskId, userUuid AS userId, tokenCipher FROM refreshTokens`;
    return this.db.prepare(query).all().map(row => ISerializable.deserialize(Token, row));
  }

  public update(token: Token): void {
    throw new Error("Updating refresh tokens is forbidden. Delete and create a new one");
  }

  public delete(token: Token): void {
    const query = `DELETE FROM refreshTokens WHERE uuid = $id`;
    runTransaction(this.db, query, { id: token.id });
  }
}
