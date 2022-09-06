import jwt from "jsonwebtoken";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { decodeAccessToken } from "../util/jwt/decodeAccessToken";

export function requireAccessToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader == null) throw (createError(StatusCodes.UNAUTHORIZED, "Missing Authorization header"));

  const authHeaderComponents = authHeader.split(" ").map((str) => str.trim());
  if (authHeaderComponents.length !== 2) throw (createError(StatusCodes.BAD_REQUEST, "Unknown Authorization header syntax"));
  if (authHeaderComponents[0] !== "Bearer") throw (createError(StatusCodes.BAD_REQUEST, `Expected 'Bearer' got ${authHeaderComponents[0]}`));

  try {
    const accessToken = authHeaderComponents[1];
    req.accessTokenContent = decodeAccessToken(accessToken);
    // TODO use new Token()

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      let errMsg = error.message;

      // Lowercase error messages are annoying
      if (error.message.toLowerCase() === "invalid token") {
        errMsg = "Invalid token";
      } else if (error.message.toLowerCase() === "jwt expired") {
        errMsg = "JWT expired";
      }

      // Rethrow possible errors like "jwt expired" as a NetworkError with a proper HTTP code, i.e., not simply 500.
      error = createError(StatusCodes.FORBIDDEN, errMsg);
    }
    throw error;
  }
}
