import jwt from "jsonwebtoken";
import { ISerializable } from "@models/repositories/ISerializable";
import { ITokenRecord } from "@models/ITokenRecord";
import { User } from "@models/User";
import { Model } from "../Model";
import { UserTokensRepositorySQLite } from "@models/repositories/sqlite/UserTokensRepositorySQLite";

export class JWTToken implements ISerializable {
  public id: string;
  public userId: string;
  public username: string;
  public grantType: string;
  public passphrase: string;
  public options: { expiresIn: number };

  public static decode(jwtEncoding: string, passphrase: string): Readonly<JWTToken> {
    const token = new JWTToken();
    token.passphrase = passphrase;
    token.decode(jwtEncoding);

    return Object.freeze(token);
  }

  public encode(): string {
    return jwt.sign(this.serializeToObject(), this.passphrase, this.options);
  }

  public decode(jwtEncoding: string): void {
    if (this.passphrase == null) throw new Error("Passphrase is null");
    this.deserializeFromObject(jwt.verify(jwtEncoding, this.passphrase));
  }

  public deserializeFromObject({ tokenId, userId, username, grantType }: ITokenRecord): void {
    if (!tokenId || !userId || !username || !grantType) throw new Error("Null"); // TODO Check properly
    this.id = tokenId;
    this.userId = userId;
    this.username = username;
    this.grantType = grantType;
  }

  public serializeToObject(): ITokenRecord {
    return {
      tokenId: this.id,
      userId: this.userId,
      username: this.username,
      grantType: this.grantType,
    };
  }

  public save(user: User): void {
    Model.tokenRepository.create(this);
    new UserTokensRepositorySQLite(Model.db, user).create(this);
  }
}
