import { IRepository } from "@models/repositories/IRepository";
import { JWTToken } from "@models/JWTToken";

export interface IRefreshTokenRepository extends IRepository<JWTToken, string> {
  create(refreshToken: JWTToken): void;

  read(refreshTokenId: string): JWTToken | null;

  readAll(): JWTToken[];

  update(refreshToken: JWTToken): void;

  delete(refreshToken: JWTToken): void;
}
