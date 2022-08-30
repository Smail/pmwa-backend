import * as Model from "../Model";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { User, UserBuilder } from "@models/User";
import { existsUsername, users } from "../Model";

export const get_user = (req, res, next) => {
  // @ts-ignore TODO
  res.send(Model.getUserFromUuid(req.body.uuid)?.toString()); // TODO this is weird code? toString doesnt exists TODO (...)?.username
}

export const create_user = async (req, res, next) => {
  const { username, firstName, lastName, email, password } = req.body;

  for (const key of ["username", "firstName", "lastName", "email", "password"]) {
    if (!req.body[key]) return next(createError(StatusCodes.BAD_REQUEST, `Missing key '${key}'`));
  }

  // TODO regex test for first and last name, i.e., no special characters like '@' in name.
  if (User.isValidEmail(email)) return next(createError(StatusCodes.BAD_REQUEST, 'Invalid email'));
  if (User.isPasswordWeak(password)) return next(createError(StatusCodes.UNPROCESSABLE_ENTITY, 'Password is too weak'));
  if (existsUsername(username)) return next(createError(StatusCodes.CONFLICT, 'Username already exists'));

  // Create new user
  const user: User = new UserBuilder()
    .addUsername(username)
    .addFirstName(firstName)
    .addLastName(lastName)
    .addEmail(email)
    .addPassword(password)
    .build();

  users.push(user);
  res.status(StatusCodes.CREATED).send({ id: user.uuid });
}

export const get_display_name = (req, res, next) => {
  // @ts-ignore TODO
  res.send({ displayName: Model.getUserFromUsername(req.accessTokenContent.username)?.displayName }); // TODO null coalescing
}
