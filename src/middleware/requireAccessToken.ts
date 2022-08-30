import jwt from "jsonwebtoken";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { decodeAccessToken } from "@auth/decodeAccessToken";

export function requireAccessToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader == null) return next(createError(StatusCodes.UNAUTHORIZED, "Missing Authorization header"));

  const authHeaderComponents = authHeader.split(" ").map((str) => str.trim());
  if (authHeaderComponents.length !== 2) return next(createError(StatusCodes.BAD_REQUEST, "Unknown Authorization header syntax"));
  if (authHeaderComponents[0] !== "Bearer") return next(createError(StatusCodes.BAD_REQUEST, `Expected 'Bearer' got ${authHeaderComponents[0]}`));

  try {
    const accessToken = authHeaderComponents[1];
    req.accessTokenContent = decodeAccessToken(accessToken);
  } catch (error) {
    // Rethrow possible errors like "jwt expired" as a NetworkError with a proper HTTP code, i.e., not simply 500.
    const code = (error instanceof jwt.JsonWebTokenError) ? StatusCodes.BAD_REQUEST : StatusCodes.INTERNAL_SERVER_ERROR;
    return next(createError(code, error.message));
  }

  next();
}
