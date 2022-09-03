import { IRepository } from "@models/repositories/IRepository";
import { Token } from "@models/Token";

export interface IRefreshTokenRepository extends IRepository<Token, string> {
  create(refreshToken: Token): void;

  read(refreshTokenId: string): Token;

  readAll(): Token[];

  update(refreshToken: Token): void;

  delete(refreshToken: Token): void;
}
