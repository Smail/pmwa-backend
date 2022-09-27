import CryptoJS from "crypto-js";
import { ITokenRepository } from "@models/repositories/ITokenRepository";
import { JWTToken } from "@models/JWTToken";
import { sqlite3 } from "better-sqlite3";
import { runTransaction } from "../../../util/db/runTransaction";
import { SQLiteTable } from "@models/repositories/sqlite/SQLiteTable";

export class TokenRepositorySQLite extends SQLiteTable implements ITokenRepository {
  public static readonly tableSchema: string =
    `CREATE TABLE IF NOT EXISTS Tokens (
        tokenId     TEXT        NOT NULL PRIMARY KEY,
        tokenCipher TEXT UNIQUE NOT NULL,
        grantType   TEXT        NOT NULL CHECK (grantType == 'access' OR grantType == 'refresh'),
        created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`;

  public constructor(db: sqlite3) {
    super(db, TokenRepositorySQLite.tableSchema);

    if (!process.env.AES_KEY) {
      throw new Error("Missing environment variable AES_KEY");
    }
    if (process.env.ACCESS_TOKEN_PASSPHRASE == null) {
      throw new Error("Missing environment variable ACCESS_TOKEN_PASSPHRASE");
    }
    if (process.env.REFRESH_TOKEN_PASSPHRASE == null) {
      throw new Error("Missing environment variable REFRESH_TOKEN_PASSPHRASE");
    }
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
    const query = `INSERT INTO Tokens (tokenId, tokenCipher, grantType)
                   VALUES ($tokenId, $tokenCipher, $grantType)`;
    const tokenCipher = TokenRepositorySQLite.encryptToken(token.encode());

    runTransaction(this.db, query, { tokenId: token.id, tokenCipher: tokenCipher, grantType: token.grantType });
  }

  public read(tokenId: string): JWTToken | null {
    const query = `SELECT * FROM Tokens WHERE tokenId = $tokenId`;
    const row = this.db.prepare(query).get({ tokenId: tokenId });
    if (row == null) return null;

    const accessTokenPassphrase = process.env.ACCESS_TOKEN_PASSPHRASE;
    const refreshTokenPassphrase = process.env.REFRESH_TOKEN_PASSPHRASE;
    const passphrase = (row.grantType === "refresh") ? refreshTokenPassphrase : accessTokenPassphrase;
    if (passphrase == null) throw new Error("Passphrase is null");

    return JWTToken.decode(TokenRepositorySQLite.decryptToken(row.tokenCipher), passphrase);
  }

  public readAll(): JWTToken[] {
    const query = `SELECT * FROM Tokens`;
    const accessTokenPassphrase = process.env.ACCESS_TOKEN_PASSPHRASE;
    const refreshTokenPassphrase = process.env.REFRESH_TOKEN_PASSPHRASE;
    if (accessTokenPassphrase == null) throw new Error("Access token passphrase is missing");
    if (refreshTokenPassphrase == null) throw new Error("Refresh token passphrase is missing");

    const rows = this.db.prepare(query).all();
    const accessTokens = rows.filter(row => row.grantType === "access")
      .map(row => JWTToken.decode(TokenRepositorySQLite.decryptToken(row.tokenCipher), accessTokenPassphrase));
    const refreshTokens = rows.filter(row => row.grantType === "refresh")
      .map(row => JWTToken.decode(TokenRepositorySQLite.decryptToken(row.tokenCipher), refreshTokenPassphrase));

    return accessTokens.concat(refreshTokens);
  }

  public update(token: JWTToken): void {
    throw new Error("Updating refresh tokens is forbidden, i.e., they're immutable. Delete and create a new one");
  }

  public delete(token: JWTToken): void {
    const query = `DELETE FROM Tokens WHERE tokenId = $tokenId`;
    runTransaction(this.db, query, { tokenId: token.id });
  }
}
