import jwt from "jsonwebtoken";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { decodeAccessToken } from "../util/jwt/decodeAccessToken";
import { convertJwtErrorToHttpErrorIfPossible } from "../util/jwt/convertJwtErrorToHttpErrorIfPossible";

export function requireAccessToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader == null) throw createError(StatusCodes.UNAUTHORIZED, "Missing Authorization header");

  const authHeaderComponents = authHeader.split(" ").map((str) => str.trim());
  if (authHeaderComponents.length !== 2) throw createError(StatusCodes.BAD_REQUEST, "Unknown Authorization header syntax");
  if (authHeaderComponents[0] !== "Bearer") throw createError(StatusCodes.BAD_REQUEST, `Expected 'Bearer' got ${authHeaderComponents[0]}`);

  try {
    const accessToken = authHeaderComponents[1];
    req.accessTokenContent = decodeAccessToken(accessToken);
    // TODO use new Token()

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) throw convertJwtErrorToHttpErrorIfPossible(error);
    if (error instanceof SyntaxError) throw createError(StatusCodes.BAD_REQUEST, error.message);
    throw error;
  }
}
