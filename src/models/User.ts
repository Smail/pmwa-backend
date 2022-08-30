import bcrypt from "bcrypt";
import { ISerializable } from "@models/ISerializable";
import { validate as isValidUuid } from "uuid";

export class User implements ISerializable {
  public id: string;
  public username: string;
  public displayName: string;
  public firstName: string;
  public lastName: string;
  public email: string;
  public toJSON = this.serializeToObject();

  private _passwordHash: string;

  public get passwordHash(): string {
    return this._passwordHash;
  }

  public set password(password: string) {
    this._passwordHash = bcrypt.hashSync(password, 10);
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

  public static isValidEmail(email: string): boolean {
    const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
    return emailRegex.test(email || "");
  }

  public static isValidNaturalName(name: string): boolean {
    // TODO add support for non ascii chars
    // Only first letter should be allowed to be uppercase
    return /^[A-Z]?[a-z]+$/.test(name || "");
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
}
