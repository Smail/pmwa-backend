import { StatusCodes } from "http-status-codes";
import createError from "http-errors";

export function requireTaskName(req, res, next) {
  if (!req.body) return next(createError(StatusCodes.BAD_REQUEST, "Request body is falsy"));
  if (!req.body.name) return next(createError(StatusCodes.BAD_REQUEST, "No name provided"));
  if (typeof req.body.name !== "string") return next(createError(StatusCodes.BAD_REQUEST, "Name is not a string"));
  if (req.task && typeof req.task !== "object") {
    return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, `Already assigned unexpected type ${typeof req.task}`));
  }

  if (!req.task) req.task = {};
  req.task.name = req.body.name;

  next();
}