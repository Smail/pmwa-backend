import { StatusCodes } from "http-status-codes";
import { validate as isValidUUID } from "uuid";
import createError from "http-errors";

export function requireUuid(req, res, next) {
  if (!req.body) return next(createError(StatusCodes.BAD_REQUEST, 'Request body is falsy'));
  if (!req.body.uuid) return next(createError(StatusCodes.BAD_REQUEST, 'No UUID provided'));
  if (!isValidUUID(req.body.uuid)) return next(createError(StatusCodes.BAD_REQUEST, 'Invalid UUID'));

  next();
}