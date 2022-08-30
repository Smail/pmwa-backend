import { IRepository } from "@models/IRepository";
import { EncryptedToken } from "@models/EncryptedToken";

export interface IRefreshTokenRepository extends IRepository<EncryptedToken, string> {
  create(refreshToken: EncryptedToken): void;

  read(refreshTokenId: string): EncryptedToken;

  update(refreshToken: EncryptedToken): void;

  delete(refreshToken: EncryptedToken): void;
}
