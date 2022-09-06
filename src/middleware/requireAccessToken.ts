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
    // Rethrow possible errors like "jwt expired" as a NetworkError with a proper HTTP code, i.e., not simply 500.
    const code = (error instanceof jwt.JsonWebTokenError) ? StatusCodes.BAD_REQUEST : StatusCodes.INTERNAL_SERVER_ERROR;
    throw (createError(code, error.message));
  }
}
