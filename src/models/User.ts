import bcrypt from "bcrypt";
import { ISerializable } from "@models/repositories/ISerializable";
import { v4 as uuidv4, validate as isValidUuid } from "uuid";
import { Token, UserAccessTokenPayload, UserRefreshTokenPayload } from "@models/Token";

export class User implements ISerializable {
  public id: string;
  public username: string;
  public displayName: string;
  public firstName: string;
  public lastName: string;
  public email: string;

  private _passwordHash: string;

  public get passwordHash(): string {
    return this._passwordHash;
  }

  public set password(password: string) {
    if (!User.isValidPassword(password)) throw new Error("Invalid password");
    this._passwordHash = bcrypt.hashSync(password, 10);
  }

  public static hashPassword(password): string {
    return bcrypt.hashSync(password, 10);
  }

  public static checkPassword(password, passwordHash): boolean {
    return bcrypt.compareSync(password, passwordHash);
  }

  public static isValidId(id: string): boolean {
    return isValidUuid(id);
  }

  public static isValidUsername(username: string): boolean {
    return /^[a-z0-9-_.]+$/i.test(username || "");
  }

  public static isValidDisplayName(displayName: string): boolean {
    return this.isValidUsername(displayName);
  }

  public static isValidPassword(password: string): boolean {
    return true; // TODO
  }

  public static isValidEmail(email: string): boolean {
    const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
    return emailRegex.test(email || "");
  }

  public static isValidNaturalName(name: string): boolean {
    // TODO add support for non ascii chars
    // Only first letter should be allowed to be uppercase
    return /^[A-Z]?[a-z]+$/.test(name || "");
  }

  public toJSON(): object {
    return this.serializeToObject();
  }

  public assignUniqueId(): void {
    this.id = uuidv4();
  }

  // Note: this function won't deserialize any password or password hash
  public deserializeFromObject({ userId, username, displayName, firstName, lastName, email }): void {
    if (!User.isValidId(userId)) throw new Error("Invalid argument: id");
    if (!User.isValidUsername(username)) throw new Error("Invalid argument: username");
    if (!User.isValidDisplayName(displayName)) throw new Error("Invalid argument: username");
    if (!User.isValidEmail(email)) throw new Error("Invalid argument: email");
    if (!User.isValidNaturalName(firstName)) throw new Error("Invalid argument: firstName");
    if (!User.isValidNaturalName(lastName)) throw new Error("Invalid argument: lastName");

    this.id = userId;
    this.username = username;
    this.displayName = displayName;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
  }

  public serializeToObject(): Object {
    return {
      userId: this.id,
      username: this.username,
      displayName: this.displayName,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      passwordHash: this.passwordHash,
    };
  }

  public createAccessToken(): Token {
    if (!process.env.ACCESS_TOKEN_PASSPHRASE) throw new Error("Missing key ACCESS_TOKEN_PASSPHRASE in .env");
    const token = new Token();
    token.tokenPassphrase = process.env.ACCESS_TOKEN_PASSPHRASE;
    token.payload = new UserAccessTokenPayload(this.id);

    return token;
  }

  public createRefreshToken(): Token {
    if (!process.env.REFRESH_TOKEN_PASSPHRASE) throw new Error("Missing key ACCESS_TOKEN_PASSPHRASE in .env");
    const token = new Token();
    token.tokenPassphrase = process.env.REFRESH_TOKEN_PASSPHRASE;
    token.payload = new UserRefreshTokenPayload(this.id);

    return token;
  }
}
