import createError from "http-errors";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

export function checkUsername(req, res, next) {
  const tokenContent = req.accessTokenContent;

  if (!tokenContent.username) return next(createError(StatusCodes.BAD_REQUEST, "No username in token"));
  if (tokenContent.username !== req.params.username) {
    return next(createError(StatusCodes.FORBIDDEN, ReasonPhrases.FORBIDDEN));
  }

  next();
}