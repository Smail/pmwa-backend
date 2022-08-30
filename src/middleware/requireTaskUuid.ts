import { StatusCodes } from "http-status-codes";
import { validate as isValidUUID } from "uuid";
import createError from "http-errors";

export function requireTaskUuid(req, res, next) {
  if (!req.body) return next(createError(StatusCodes.BAD_REQUEST, "Request body is falsy"));
  if (!req.body.uuid) return next(createError(StatusCodes.BAD_REQUEST, "No UUID provided"));
  if (!isValidUUID(req.body.uuid)) return next(createError(StatusCodes.BAD_REQUEST, "Invalid UUID"));
  if (req.task && typeof req.task !== "object") {
    return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, `Already assigned unexpected type ${typeof req.task}`));
  }

  if (!req.task) req.task = {};
  req.task.uuid = req.body.uuid;

  next();
}