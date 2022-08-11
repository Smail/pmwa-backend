const assert = require('assert');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const { v4: uuidv4 } = require('uuid');
const lodash = require('lodash');

// Load config
require('dotenv').config();

class User {
  constructor(username, firstName, lastName, email, plaintextPassword) {
    assert(username, new Error('username is null'));
    assert(firstName, new Error('firstName is null'));
    assert(lastName, new Error('lastName is null'));
    assert(email, new Error('email is null'));
    assert(plaintextPassword, new Error('plaintextPassword is null'));

    this.id = uuidv4();
    this.username = username;
    this.firstName = firstName;
    this.lastName = lastName;

    if (User.isValidEmail(email)) {
      this.email = email;
    } else {
      throw new Error('Invalid email syntax');
    }

    // TODO
    // if (User.isPasswordWeak(plaintextPassword)) {
    //   throw new Error('Password is too weak');
    // }

    // Hash password
    // Promise
    this.passwordHash = bcrypt.hash(plaintextPassword, 10);

    this.tasks = [];
    this.refreshTokens = new Set();

    // Note: Check for new added members in isValidObject().
  }

  async verifyPassword(plaintextPassword) {
    assert(plaintextPassword, new Error('plaintextPassword is null'));
    return bcrypt.compare(plaintextPassword, await this.passwordHash);
  }

  // Create JWT access token.
  createAccessToken() {
    const payload = {
      username: this.username,
      type: 'access', // TODO change to grant-type
    };
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_PASSPHRASE, {
      // 30 min
      expiresIn: 60 * 30,
    });

    return accessToken;
  }

  // Create JWT refresh token.
  createRefreshToken() {
    const payload = {
      username: this.username,
      type: 'refresh', // TODO change to grant-type
    };
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_PASSPHRASE, {
      // 14 days
      expiresIn: 14 * 24 * 60 * 60,
    });

    // Encrypt refresh token and store it in user object.
    // TODO load real AES key from env variable that contains the file location.
    const refreshTokenCipher = CryptoJS.AES.encrypt(refreshToken, process.env.AES_KEY).toString();

    // Store refresh token to user object in database.
    // This is to be able to revoke it if necessary.
    this.refreshTokens.add(refreshTokenCipher);

    return refreshToken;
  }

  // private
  findRefreshTokenCipher(refreshToken) {
    // Search for the token in the user's refresh token set,
    // but we first need to decrypt them.
    for (const refreshTokenCipher of this.refreshTokens) {
      // Decrypt refresh token and compare it to user provided one.
      // TODO load real AES key from env variable that contains the file location.
      let decryptedRefreshToken = CryptoJS.AES.decrypt(refreshTokenCipher, process.env.AES_KEY);
      decryptedRefreshToken = decryptedRefreshToken.toString(CryptoJS.enc.Utf8);

      if (refreshToken === decryptedRefreshToken) {
        return refreshTokenCipher;
      }
    }

    return null;
  }

  hasRefreshToken(refreshToken) {
    return this.findRefreshTokenCipher(refreshToken);
  }

  removeRefreshToken(refreshToken) {
    const refreshTokenCipher = this.findRefreshTokenCipher(refreshToken);
    if (refreshTokenCipher) {
      // Remove (encrypted) refresh token.
      this.refreshTokens.delete(refreshTokenCipher);
    } else {
      // Throw error if this token doesn't belong to this user.
      throw new Error('Unknown refresh token');
    }
  }

  // Return clone of this object with the sensible data removed.
  sensibleClone() {
    // TODO add this on node>=v17 otherwise use lodash
    // const thisClone = structuredClone(this);
    const thisClone = lodash.cloneDeep(this);

    // Remove sensible data
    delete thisClone._passwordHash;
    delete thisClone.refreshTokens;

    return thisClone;
  }

  toString() {
    return JSON.stringify(this.sensibleClone);
  }

  static isPasswordWeak(password) {
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

    return !(password.length >= 8 && numLowerCase >= 2 && numUpperCase >= 1 && numDigits >= 1);
  }

  static isValidEmail(email) {
    const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
    return emailRegex.test(email);
  }
}

module.exports = { User };
