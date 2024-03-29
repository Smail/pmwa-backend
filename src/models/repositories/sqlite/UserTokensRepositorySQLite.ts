import { IUserTokensRepository } from "@models/repositories/IUserTokensRepository";
import { JWTToken } from "@models/JWTToken";
import { SQLiteTable } from "@models/repositories/sqlite/SQLiteTable";
import { sqlite3 } from "better-sqlite3";
import { User } from "@models/User";
import { runTransaction } from "../../../util/db/runTransaction";
import { TokenRepositorySQLite } from "@models/repositories/sqlite/TokenRepositorySQLite";
import { Model } from "../../../Model";

export class UserTokensRepositorySQLite extends SQLiteTable implements IUserTokensRepository {
  public static readonly tableSchema: string =
    `CREATE TABLE IF NOT EXISTS UserTokens (
        userId  TEXT NOT NULL,
        tokenId TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES Users (userId) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (tokenId) REFERENCES Tokens (tokenId) ON UPDATE CASCADE ON DELETE CASCADE,
        PRIMARY KEY (userId, tokenId)
    )`;
  public readonly user: User;

  public constructor(db: sqlite3, user: User) {
    super(db, UserTokensRepositorySQLite.tableSchema);
    this.user = user;
  }

  public create(token: JWTToken): void {
    const retrievedToken = Model.tokenRepository.read(token.id);
    if (retrievedToken == null) throw new Error(`No token with ID ${token.id} found.`);

    const query = `INSERT INTO UserTokens(userId, tokenId) VALUES ($userId, $tokenId)`;
    runTransaction(this.db, query, token.serializeToObject());
  }

  public read(tokenId: string): JWTToken | null {
    const query = `SELECT *
                   FROM UserTokens
                            JOIN UserTokens ON Tokens.tokenId = UserTokens.tokenId
                   WHERE UserTokens.userId = $userId
                     AND UserTokens.tokenId = $tokenId`;
    const row = this.db.prepare(query).get({ userId: this.user.id, tokenId: tokenId });
    const passphrase = process.env.REFRESH_TOKEN_PASSPHRASE;
    if (passphrase == null) throw new Error("Passphrase is null");

    return row != null ? JWTToken.decode(TokenRepositorySQLite.decryptToken(row.tokenCipher), passphrase) : null;
  }

  public readAll(): JWTToken[] {
    const query = `SELECT *
                   FROM UserTokens
                            JOIN Tokens ON Tokens.tokenId = UserTokens.tokenId
                   WHERE UserTokens.userId = $userId`;
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
