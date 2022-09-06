import createError from "http-errors";
import { StatusCodes } from "http-status-codes";

export function requireAuthLevelPublic(req, res, next) {
  if (req.authLevel == null) return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, "Auth level was not set"));
  // Don't check for authLevel === AUTH_LEVEL_PUBLIC, because everyone is allowed to access it.

  next();
}
