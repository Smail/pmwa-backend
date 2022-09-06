import CryptoJS from "crypto-js";
import { IRefreshTokenRepository } from "@models/repositories/IRefreshTokenRepository";
import { JWTToken } from "@models/JWTToken";
import { sqlite3 } from "better-sqlite3";
import { runTransaction } from "../../../util/db/runTransaction";
import { SQLiteTable } from "@models/repositories/sqlite/SQLiteTable";

export class RefreshTokenRepositorySQLite extends SQLiteTable implements IRefreshTokenRepository {
  public static readonly tableSchema: string =
    `CREATE TABLE IF NOT EXISTS RefreshTokens (
        tokenId     TEXT        NOT NULL PRIMARY KEY,
        tokenCipher TEXT UNIQUE NOT NULL,
        created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`;

  public constructor(db: sqlite3) {
    super(db, RefreshTokenRepositorySQLite.tableSchema);
    if (!process.env.AES_KEY) throw new Error("Missing environment variable AES_KEY");
  }

  public static encryptToken(token: string): string {
    if (!process.env.AES_KEY) throw new Error("Missing environment variable AES_KEY");
    return CryptoJS.AES.encrypt(token, process.env.AES_KEY).toString();
  }

  public static decryptToken(tokenCipher: string): string {
    if (!process.env.AES_KEY) throw new Error("Missing environment variable AES_KEY");
    return CryptoJS.AES.decrypt(tokenCipher, process.env.AES_KEY).toString(CryptoJS.enc.Utf8);
  }

  public create(token: JWTToken): void {
    const query = `INSERT INTO RefreshTokens (tokenId, tokenCipher) VALUES ($tokenId, $tokenCipher)`;
    const tokenCipher = RefreshTokenRepositorySQLite.encryptToken(token.encode());

    runTransaction(this.db, query, { tokenId: token.id, tokenCipher: tokenCipher });
  }

  public read(tokenId: string): JWTToken | null {
    const query = `SELECT * FROM RefreshTokens WHERE tokenId = $tokenId`;
    const row = this.db.prepare(query).get({ tokenId: tokenId });
    const passphrase = process.env.REFRESH_TOKEN_PASSPHRASE;
    if (passphrase == null) throw new Error("Passphrase is null");

    return row != null ? JWTToken.decode(RefreshTokenRepositorySQLite.decryptToken(row.tokenCipher), passphrase) : null;
  }

  public readAll(): JWTToken[] {
    const query = `SELECT * FROM RefreshTokens`;
    const passphrase = process.env.REFRESH_TOKEN_PASSPHRASE;
    if (passphrase == null) throw new Error("Passphrase is null");

    return this.db.prepare(query).all()
      .map(row => JWTToken.decode(RefreshTokenRepositorySQLite.decryptToken(row.tokenCipher), passphrase));
  }

  public update(token: JWTToken): void {
    throw new Error("Updating refresh tokens is forbidden, i.e., they're immutable. Delete and create a new one");
  }

  public delete(token: JWTToken): void {
    const query = `DELETE FROM RefreshTokens WHERE tokenId = $tokenId`;
    runTransaction(this.db, query, { tokenId: token.id });
  }
}
