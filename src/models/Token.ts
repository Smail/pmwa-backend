import { validate as isValidUuid } from "uuid";
import jwt from "jsonwebtoken";
import * as _ from "lodash";
import { ISerializable } from "@models/repositories/ISerializable";
import { User } from "@models/User";

export interface ITokenPayload extends ISerializable {
  tokenId: string,
}

export interface IUserTokenPayload {
  userId: string;
}

export interface ITokenGrantType {
  readonly grantType: string;
}

export abstract class AuthTokenPayload implements ITokenPayload, ITokenGrantType {
  public abstract readonly grantType: string;
  public abstract tokenId: string;

  public deserializeFromObject({ tokenId, grantType }): void {
    this.tokenId = tokenId;
    if (grantType !== this.grantType) throw new Error("Invalid grant type");
  }

  public serializeToObject(): Object {
    return structuredClone(this);
  }
}

export class UserAccessTokenPayload extends AuthTokenPayload implements IUserTokenPayload {
  public userId: string;
  public tokenId: string;
  public readonly grantType: string = "access";

  constructor(userId: string) {
    super();
    if (!User.isValidId(userId)) throw new Error("Invalid user ID");
    this.userId = userId;
  }
}

export class UserRefreshTokenPayload extends AuthTokenPayload implements IUserTokenPayload {
  public userId: string;
  public tokenId: string;
  public readonly grantType: string = "refresh";

  constructor(userId: string) {
    super();
    if (!User.isValidId(userId)) throw new Error("Invalid user ID");
    this.userId = userId;
  }
}

export class Token {
  public tokenPassphrase: string;
  public toJSON = this.serializeToObject();
  public payload: ITokenPayload;
  public lifetimeDuration: number;
  private lastState: object;

  public get id(): string {
    return this.payload.tokenId;
  }

  public set id(id: string) {
    if (!isValidUuid(id)) throw new Error("Not an UUID");
    this.payload.tokenId = id;
  }

  private _encoding: string;

  public get encoding(): string {
    if (this.shouldGenerateNewToken()) this._encoding = this.generateJwtToken();
    this.updateLastState();
    return this._encoding;
  }

  public set encoding(token: string) {
    // This checks if the token is valid and decode it
    this.payload = jwt.verify(token, this.tokenPassphrase); // TODO if the token expires this would cause an error. Maybe use decode

    if (!this.payload.tokenId == null) throw new Error("Token ID is null");
    if (!isValidUuid(this.payload.tokenId)) throw new Error("Not an UUID");

    this.id = this.payload.tokenId;
    this._encoding = token;
  }

  public deserializeFromObject({ encoding }): void {
    this.encoding = encoding;
  }

  public serializeToObject(): Object {
    return { encoding: this.encoding };
  }

  private updateLastState(): void {
    this.lastState = structuredClone(this);
  }

  private hasStateChanged(): boolean {
    return !_.isEqual(structuredClone(this), this.lastState);
  }

  private shouldGenerateNewToken(): boolean {
    let generateToken = false;
    if (this._encoding == null) generateToken = true;
    if (this.lastState == null && this._encoding != null)
      throw new Error("Invalid state. How can the last object be null, but not the token?");
    if (this.hasStateChanged()) generateToken = true;

    return generateToken;
  }

  private generateJwtToken(): string {
    if (!this.id) throw new Error("ID is not set");
    if (!this.lifetimeDuration) throw new Error("Token lifetime is not set");
    if (!this.tokenPassphrase) throw new Error("Token passphrase is not set");
    if (this.payload == null) throw new Error("Payload was not set");
    if (this.payload.tokenId !== this.id) throw new Error("ID mismatch");

    return jwt.sign({
      ...this.payload,
      // All member variables should be assigned after the payload deconstruction
      // to prevent the payload from overriding object members.
      // If for example the payload contained a "tokenId" and would come after the assignment of the members,
      // it would override the member value and contain a different ID.
      // The token would then allow the current user to access the content of another one.
    }, this.tokenPassphrase, { expiresIn: this.lifetimeDuration });
    // TODO test how "set token" behaves by setting this to 1s
  }
}
