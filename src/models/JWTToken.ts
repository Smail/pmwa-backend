import jwt from "jsonwebtoken";
import { ISerializable } from "@models/repositories/ISerializable";
import { ITokenRecord } from "@models/ITokenRecord";

export class JWTToken implements ISerializable {
  public id: string;
  public grantType: string;
  public userId: string;
  public passphrase: string;
  public options: { expiresIn: number };

  public static decode(jwtEncoding: string, passphrase: string): JWTToken {
    const token = new JWTToken();
    token.passphrase = passphrase;
    token.decode(jwtEncoding);

    return token;
  }

  public encode(): string {
    return jwt.sign(this.serializeToObject(), this.passphrase, this.options);
  }

  public decode(jwtEncoding: string): void {
    if (this.passphrase == null) throw new Error("Passphrase is null");
    this.deserializeFromObject(jwt.verify(jwtEncoding, this.passphrase));
  }

  public deserializeFromObject({ tokenId, grantType, userId }: ITokenRecord): void {
    if (!tokenId || !grantType || !userId) throw new Error("Null"); // TODO Check properly
    this.id = tokenId;
    this.grantType = grantType;
    this.userId = userId;
  }

  public serializeToObject(): ITokenRecord {
    return {
      tokenId: this.id,
      grantType: this.grantType,
      userId: this.userId,
    };
  }
}
