import jwt from "jsonwebtoken";

export function decodeAccessToken(accessToken) {
  return jwt.verify(accessToken, process.env.ACCESS_TOKEN_PASSPHRASE);
}
