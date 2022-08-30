import jwt from "jsonwebtoken";

function decodeRefreshToken(refreshToken) {
  return jwt.verify(refreshToken, process.env.REFRESH_TOKEN_PASSPHRASE);
}

export { decodeRefreshToken };
