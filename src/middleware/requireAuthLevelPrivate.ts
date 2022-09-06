import createError from "http-errors";
import { AUTH_LEVEL_PRIVATE } from "@middleware/setAuthLevel";
import { StatusCodes } from "http-status-codes";

export function requireAuthLevelPrivate(req, res, next) {
  if (req.authLevel == null) return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, "Auth level was not set"));
  if (req.authLevel !== AUTH_LEVEL_PRIVATE) {
    return next(createError(StatusCodes.FORBIDDEN,
      "This is a private resource/route"));
  }

  next();
}
