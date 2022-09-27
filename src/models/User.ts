import bcrypt from "bcrypt";
import { ISerializable } from "@models/repositories/ISerializable";
import { v4 as uuidV4, validate as isValidUuid } from "uuid";
import { JWTToken } from "@models/JWTToken";
import { IUserRecord } from "@models/IUserRecord";
import { Model } from "../Model";

export class User implements ISerializable {
  public id: string;
  public username: string;
  public displayName: string;
  public firstName: string;
  public lastName: string;
  public email: string;
  private settings: object = {};

  private _passwordHash: string;

  public get passwordHash(): string {
    return this._passwordHash;
  }

  public set password(password: string) {
    if (!User.isValidPassword(password)) throw new Error("Invalid password");
    this._passwordHash = User.hashPassword(password);
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
    // Forbid UUIDs as username
    if (isValidUuid(username)) return false;
    return /^[a-z0-9-_.]+$/i.test(username || "");
  }

  public static isValidDisplayName(displayName: string | null): boolean {
    return displayName == null ? true : this.isValidUsername(displayName);
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
    return /^[a-z']+$/i.test(name || "");
  }

  public static throwIfInvalid({ userId, username, displayName, firstName, lastName, email }: IUserRecord): void {
    if (!User.isValidId(userId)) throw new Error(`Invalid argument: userId = ${userId}`);
    if (!User.isValidUsername(username)) throw new Error(`Invalid argument: username = ${username}`);
    if (!User.isValidDisplayName(displayName)) throw new Error(`Invalid argument: displayName = ${displayName}`);
    if (!User.isValidNaturalName(firstName)) throw new Error(`Invalid argument: firstName = ${firstName}`);
    if (!User.isValidNaturalName(lastName)) throw new Error(`Invalid argument: lastName = ${lastName}`);
    if (!User.isValidEmail(email)) throw new Error(`Invalid argument: email = ${email}`);
  }

  public assignUniqueId(): void {
    this.id = uuidV4();
  }

  // Note: this function won't deserialize any password or password hash
  public deserializeFromObject({ userId, username, displayName, firstName, lastName, email, settings }): void {
    User.throwIfInvalid({ userId, username, displayName, firstName, lastName, email });
    this.id = userId;
    this.username = username;
    this.displayName = displayName;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.settings = JSON.parse(settings);
  }

  public serializeToObject(): IUserRecord {
    const o = {
      userId: this.id,
      username: this.username,
      displayName: this.displayName,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      passwordHash: this.passwordHash,
      settings: JSON.stringify(this.settings),
    };
    User.throwIfInvalid(o);
    return o;
  }

  public createAccessToken(): JWTToken {
    if (!process.env.ACCESS_TOKEN_PASSPHRASE) {
      throw new Error("Missing key ACCESS_TOKEN_PASSPHRASE in environment variables");
    }
    const token = new JWTToken();
    const lifetime = 60 * 10; // 10 min

    token.id = uuidV4();
    token.userId = this.id;
    token.username = this.username;
    token.grantType = "access";
    token.passphrase = process.env.ACCESS_TOKEN_PASSPHRASE;
    token.options = { expiresIn: lifetime };

    token.save(this);

    return token;
  }

  public createRefreshToken(): JWTToken {
    if (!process.env.REFRESH_TOKEN_PASSPHRASE) {
      throw new Error("Missing key REFRESH_TOKEN_PASSPHRASE in environment variables");
    }
    const token = new JWTToken();
    const lifetime = 60 * 60 * 24 * 14; // 2 weeks

    token.id = uuidV4();
    token.userId = this.id;
    token.username = this.username;
    token.grantType = "refresh";
    token.passphrase = process.env.REFRESH_TOKEN_PASSPHRASE;
    token.options = { expiresIn: lifetime };

    token.save(this);

    return token;
  }

  public updateSettings(settings: object): void {
    for (const key in settings) {
      this.settings[key] = settings[key];
    }
  }

  public public(): { userId: string, username: string, displayName: string } {
    const o = this.serializeToObject();
    return {
      userId: o.userId,
      username: o.username,
      displayName: o.displayName,
    };
  }

  public save(): void {
    Model.userRepository.create(this);
  }
}
