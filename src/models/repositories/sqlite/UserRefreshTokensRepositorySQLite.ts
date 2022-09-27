import { IUserRefreshTokensRepository } from "@models/repositories/IUserRefreshTokensRepository";
import { JWTToken } from "@models/JWTToken";
import { SQLiteTable } from "@models/repositories/sqlite/SQLiteTable";
import { sqlite3 } from "better-sqlite3";
import { User } from "@models/User";
import { runTransaction } from "../../../util/db/runTransaction";
import { TokenRepositorySQLite } from "@models/repositories/sqlite/TokenRepositorySQLite";
import { Model } from "../../../Model";

export class UserRefreshTokensRepositorySQLite extends SQLiteTable implements IUserRefreshTokensRepository {
  public static readonly tableSchema: string =
    `CREATE TABLE IF NOT EXISTS UserRefreshTokens (
        userId  TEXT NOT NULL,
        tokenId TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES Users (userId) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (tokenId) REFERENCES RefreshTokens (tokenId) ON UPDATE CASCADE ON DELETE CASCADE,
        PRIMARY KEY (userId, tokenId)
    )`;
  public readonly user: User;

  public constructor(db: sqlite3, user: User) {
    super(db, UserRefreshTokensRepositorySQLite.tableSchema);
    this.user = user;
  }

  public create(token: JWTToken): void {
    const retrievedToken = Model.tokenRepository.read(token.id);
    if (retrievedToken == null) throw new Error(`No token with ID ${token.id} found.`);

    const query = `INSERT INTO UserRefreshTokens(userId, tokenId) VALUES ($userId, $tokenId)`;
    runTransaction(this.db, query, token.serializeToObject());
  }

  public read(tokenId: string): JWTToken | null {
    const query = `SELECT *
                   FROM UserRefreshTokens
                            JOIN RefreshTokens ON RefreshTokens.tokenId = UserRefreshTokens.tokenId
                   WHERE UserRefreshTokens.userId = $userId
                     AND UserRefreshTokens.tokenId = $tokenId`;
    const row = this.db.prepare(query).get({ userId: this.user.id, tokenId: tokenId });
    const passphrase = process.env.REFRESH_TOKEN_PASSPHRASE;
    if (passphrase == null) throw new Error("Passphrase is null");

    return row != null ? JWTToken.decode(TokenRepositorySQLite.decryptToken(row.tokenCipher), passphrase) : null;
  }

  public readAll(): JWTToken[] {
    const query = `SELECT *
                   FROM UserRefreshTokens
                            JOIN RefreshTokens ON RefreshTokens.tokenId = UserRefreshTokens.tokenId
                   WHERE UserRefreshTokens.userId = $userId`;
    const passphrase = process.env.REFRESH_TOKEN_PASSPHRASE;
    if (passphrase == null) throw new Error("Passphrase is null");
    return this.db.prepare(query)
      .all({ userId: this.user.id })
      .map(row => JWTToken.decode(TokenRepositorySQLite.decryptToken(row.tokenCipher), passphrase));
  }

  public update(token: JWTToken): void {
    throw new Error("Updating a relationship directly is forbidden. Updates will cascade automagically.");
  }

  public delete(token: JWTToken): void {
    throw new Error("Deleting a relationship directly is forbidden. Deletions will cascade automagically.");
  }
}
