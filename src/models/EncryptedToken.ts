import { ISerializable } from "@models/ISerializable";

export class EncryptedToken implements ISerializable {
  public id: string;
  public userId: string;
  public name: string;
  public toJSON = this.serializeToObject();
  private _tokenCipher: string;

  public get token(): string {
    // TODO check if is valid JWT
    // TODO decrypt
    return this._tokenCipher;
  }

  public set token(token: string) {
    // TODO check if is valid JWT
    // TODO encrypt - Bridge pattern
    // TODO Maybe the refreshTokenRepository should deal with encryption, but this would keep the token in memory
    this._tokenCipher = token;
  }

  public deserializeFromObject({ tokenId, userId, tokenCipher }): void {
    this.id = tokenId;               // TODO check valid UUID
    this.userId = userId;            // TODO check valid UUID
    this._tokenCipher = tokenCipher; // TODO check if decrypted token is a valid JWT
  }

  public serializeToObject(): Object {
    return { tokenId: this.id, userId: this.userId, tokenCipher: this._tokenCipher };
  }
}
