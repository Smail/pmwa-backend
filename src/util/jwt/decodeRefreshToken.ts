import jwt from "jsonwebtoken";

export function decodeRefreshToken(refreshToken) {
  return jwt.verify(refreshToken, process.env.REFRESH_TOKEN_PASSPHRASE);
}
