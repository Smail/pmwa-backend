import assert from "assert";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import CryptoJS from "crypto-js";

const { v4: uuidv4, validate: isValidUUID } = require('uuid');
const Database = require('./database');

// Load config
require('dotenv').config();

function isValidBcryptHash(hash: string): boolean {
  return /^\$2[aby]?\$\d{1,2}\$[.\/A-Za-z0-9]{53}$/.test(hash);
}

function isValidEmail(email: string): boolean {
  const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
  return emailRegex.test(email);
}

function isValidPassword(password: string): boolean {
  if (!password) return false;

  let numLowerCase = 0;
  let numUpperCase = 0;
  let numDigits = 0;
  let numSpecial = 0;
  for (let i = 0; i < password.length; i++) {
    const c = password[i];

    if (/^[a-z]$/.test(c)) numLowerCase++;
    else if (/^[A-Z]$/.test(c)) numUpperCase++;
    else if (/^[0-9]$/.test(c)) numDigits++;
    else if (/^[!@#$%^&*()\-__+.]$/.test(c)) numSpecial++;
    // Password contains invalid character.
    else return false;
  }

  return password.length >= 8 && numLowerCase >= 2 && numUpperCase >= 1 && numDigits >= 1;
}

enum UserStatements {
  SELECT_ALL_USER_WITH_UUID = 'SELECT * FROM users WHERE uuid = $uuid',
  SELECT_ALL_USER_WITH_USERNAME = 'SELECT * FROM users WHERE username = $username',
  SELECT_UUID_FROM_USERNAME = 'SELECT uuid FROM users WHERE username = $username',
  SELECT_USERNAME = 'SELECT username FROM users WHERE uuid = $uuid',
  SELECT_DISPLAY_NAME = 'SELECT displayName FROM users WHERE uuid = $uuid',
  SELECT_FIRST_NAME = 'SELECT firstName FROM users WHERE uuid = $uuid',
  SELECT_LAST_NAME = 'SELECT lastName FROM users WHERE uuid = $uuid',
  SELECT_EMAIL = 'SELECT email FROM users WHERE uuid = $uuid',
  SELECT_PASSWORD_HASH = 'SELECT passwordHash FROM users WHERE uuid = $uuid',
  COUNT_UUIDS = 'SELECT COUNT(*) AS count FROM users WHERE uuid = $uuid',
  COUNT_USERNAMES = 'SELECT COUNT(*) AS count FROM users WHERE username = $username',
  SELECT_REFRESH_TOKENS = 'SELECT tokenCipher FROM users JOIN refreshTokens ON users.uuid = refreshTokens.userUuid WHERE users.uuid = $uuid',
  INSERT_USER = 'INSERT INTO users (uuid, username, displayName, firstName, lastName, email, passwordHash) VALUES ($uuid, $username, $displayName, $firstName, $lastName, $email, $passwordHash)',
  INSERT_REFRESH_TOKEN = 'INSERT INTO refreshTokens (uuid, tokenCipher, userUuid) VALUES ($uuid, $tokenCipher, $userUuid)',
}

class UserBuilder {
  private readonly uuid: string;
  private username: string;
  private firstName: string;
  private lastName: string;
  private email: string;
  private passwordHash: string;
  private displayName: string;

  constructor() {
    this.uuid = uuidv4();
  }

  public addUsername(v: string): UserBuilder {
    if (!v) throw new Error('Argument is falsy');
    this.username = v;
    return this;
  }

  public addDisplayName(v: string): UserBuilder {
    if (!v) throw new Error('Argument is falsy');
    this.displayName = v;
    return this;
  }

  public addFirstName(v: string): UserBuilder {
    if (!v) throw new Error('Argument is falsy');
    this.firstName = v.toLowerCase();
    return this;
  }

  public addLastName(v: string): UserBuilder {
    if (!v) throw new Error('Argument is falsy');
    this.lastName = v;
    return this;
  }

  public addEmail(v: string): UserBuilder {
    if (!v) throw new Error('Argument is falsy');
    if (!isValidEmail(v)) throw new Error('Invalid email syntax');
    this.email = v;
    return this;
  }

  public addPassword(v: string): UserBuilder {
    if (!v) throw new Error('Argument is falsy');
    this.passwordHash = User.hashPassword(v);
    return this;
  }

  public addPasswordHash(v: string): UserBuilder {
    if (!v) throw new Error('Argument is falsy');
    if (!isValidBcryptHash(v)) throw new Error('Invalid bcrypt hash');
    this.passwordHash = v;
    return this;
  }

  public build(): User {
    const stmt = Database.db.prepare(UserStatements.INSERT_USER);
    stmt.run({
      uuid: this.uuid,
      username: this.username,
      displayName: this.displayName,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      passwordHash: this.passwordHash,
    });
    return User.fromUUID(this.uuid);
  }
}

class User {
  private readonly _uuid: string;

  constructor(uuid) {
    if (!isValidUUID(uuid)) throw new Error('Not a valid UUID');
    if (!User.existsUUID(uuid)) throw new Error('User with such UUID does not exists');
    this._uuid = uuid;
  }

  /**
   * Return all refresh tokens as encrypted ciphertext.
   */
  private get refreshTokenCiphers(): Set<string> {
    const tokens = new Set<string>;
    const stmt = Database.db.prepare(UserStatements.SELECT_REFRESH_TOKENS, { uuid: this._uuid });

    for (const row of stmt.all({ uuid: this.uuid })) {
      tokens.add(row.tokenCipher);
    }

    return tokens;
  }

  /**
   * Return all (decrypted) refresh tokens of this user.
   */
  private get refreshTokens(): Set<string> {
    return new Set(
      Array.from(this.refreshTokenCiphers)
        .map(cipher => CryptoJS.AES.decrypt(cipher, process.env.AES_KEY))
        .map(decryptedBuffer => decryptedBuffer.toString(CryptoJS.enc.Utf8))
    );
  }

  public get uuid(): string {
    return this._uuid;
  }

  public set username(v: string) {
    if (!v) throw new Error('Argument is falsy');
    if (User.existsUsername(v)) throw new Error('Username already exists');
    this.updateDatabaseValue('updateUsername', { username: v.toLowerCase() });
  }

  public get username(): string {
    return this.getDatabaseValue(UserStatements.SELECT_USERNAME).username;
  }

  public get displayName(): string {
    return this.getDatabaseValue(UserStatements.SELECT_DISPLAY_NAME).displayName;
  }

  public set firstName(v: string) {
    if (!v) throw new Error('Argument is falsy');
    this.updateDatabaseValue('updateFirstName', { firstName: v });
  }

  public get firstName(): string {
    return this.getDatabaseValue(UserStatements.SELECT_FIRST_NAME).firstName;
  }

  public set lastName(v: string) {
    if (!v) throw new Error('Argument is falsy');
    this.updateDatabaseValue('updateLastName', { lastName: v });
  }

  public get lastName(): string {
    return this.getDatabaseValue(UserStatements.SELECT_LAST_NAME).lastName;
  }

  public set email(v: string) {
    if (!isValidEmail(v)) throw new Error('Invalid email syntax');
    this.updateDatabaseValue('updateEmail', { email: v });
  }

  public get email(): string {
    return this.getDatabaseValue(UserStatements.SELECT_EMAIL).email;
  }

  public set password(v: string) {
    this.passwordHash = User.hashPassword(v);
  }

  private set passwordHash(v: string) {
    if (!isValidBcryptHash(v)) throw new Error('Not a bcrypt hash');
    this.updateDatabaseValue('updatePasswordHash', { passwordHash: v });
  }

  private get passwordHash(): string {
    return this.getDatabaseValue(UserStatements.SELECT_PASSWORD_HASH).passwordHash;
  }

  private updateDatabaseValue(queryName: string, bindings: object) {
    if (bindings['uuid']) throw new Error('UUID is already bound');

    Database.db.transaction(() => {
      const stmt = Database.db.prepare(Database.queries[queryName]);
      const rows = stmt.run({ uuid: this.uuid, ...bindings });
      if (rows.changes > 1) throw new Error(`Too many changes: ${rows.changes}`);
      if (rows.changes == 0) throw new Error('No rows returned');
    });
  }

  private getDatabaseValue(queryName: string, bindings: object = {}): any {
    if (bindings['uuid']) throw new Error('UUID is already bound');

    const stmt = Database.db.prepare(queryName);
    const row = stmt.get({ uuid: this.uuid, ...bindings });
    if (!row) throw new Error('No rows returned');
    if (!Object.keys(row).length) throw new Error('No colums returned');
    return row;
  }

  public async verifyPassword(plaintextPassword: string): Promise<boolean> {
    assert(plaintextPassword, new Error('plaintextPassword is null'));
    return bcrypt.compare(plaintextPassword, this.passwordHash);
  }

  /**
   * Create JWT access token for this user.
   * @returns JWT token - string
   */
  public createAccessToken(): string {
    return jwt.sign(
      {
        username: this.username,
        type: 'access', // TODO change to grant-type
      },
      process.env.ACCESS_TOKEN_PASSPHRASE,
      {
        // 30 min
        expiresIn: 60 * 30,
      }
    );
  }

  /**
   * Create JWT refresh token for this user.
   * @returns JWT token - string
   */
  public createRefreshToken(): string {
    const refreshToken = jwt.sign(
      {
        uuid: this.uuid,
        username: this.username,
        type: 'refresh', // TODO change to grant-type
      },
      process.env.REFRESH_TOKEN_PASSPHRASE,
      {
        // 14 days
        expiresIn: 14 * 24 * 60 * 60,
      }
    );

    this.storeRefreshTokenCipher(refreshToken);
    return refreshToken;
  }

  /**
   * Encrypt and store a refresh token into the database.
   * @param plaintextRefreshToken
   */
  private storeRefreshTokenCipher(plaintextRefreshToken) {
    // Encrypt refresh token and store it in user object.
    // TODO load real AES key from env variable that contains the file location.
    const refreshTokenCipher = CryptoJS.AES
      .encrypt(plaintextRefreshToken, process.env.AES_KEY)
      .toString();

    // Store refresh token to user object in database.
    // This is to be able to revoke it if necessary.
    Database.db.prepare(UserStatements.INSERT_REFRESH_TOKEN)
      .run({ uuid: uuidv4(), tokenCipher: refreshTokenCipher, userUuid: this.uuid });
  }

  public static fromUsername(username: string): User {
    if (!username) throw new Error('Not a valid UUID');
    const stmt = Database.db.prepare(UserStatements.SELECT_UUID_FROM_USERNAME);
    const row = stmt.get({ username: username });
    return new User(row.uuid);
  }

  public static fromUUID(uuid: string): User {
    return new User(uuid);
  }

  public static existsUsername(username: string): boolean {
    const stmt = Database.db.prepare(UserStatements.COUNT_USERNAMES);
    const row = stmt.get({ username: username.toLowerCase() });

    return parseInt(row[0]) > 0;
  }

  public static existsUUID(uuid: string): boolean {
    if (!isValidUUID(uuid)) throw new Error('Not a valid UUID');
    const stmt = Database.db.prepare(UserStatements.COUNT_UUIDS);
    const row = stmt.get({ uuid: uuid });
    const count = parseInt(row.count);
    if (count > 1) throw new Error('Database inconsistent. Multiple equal UUIDs');
    return count === 1;
  }

  public static hashPassword(plaintextPassword: string): string {
    return bcrypt.hashSync(plaintextPassword, 10);
  }
}

module.exports = { User, UserBuilder };
