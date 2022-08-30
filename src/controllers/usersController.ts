import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import * as Model from "../Model";
import { User, UserBuilder } from "@models/User";

export const get_user = (req, res, next) => {
  // @ts-ignore TODO
  res.send(Model.getUserFromUuid(req.body.uuid)?.toString()); // TODO this is weird code? toString doesnt exists TODO (...)?.username
};

export const create_user = async (req, res, next) => {
  const { username, firstName, lastName, email, password } = req.body;

  for (const key of ["username", "firstName", "lastName", "email", "password"]) {
    if (!req.body[key]) return next(createError(StatusCodes.BAD_REQUEST, `Missing key '${key}'`));
  }

  // TODO regex test for first and last name, i.e., no special characters like '@' in name.
  if (User.isValidEmail(email)) return next(createError(StatusCodes.BAD_REQUEST, "Invalid email"));
  if (User.isPasswordWeak(password)) return next(createError(StatusCodes.UNPROCESSABLE_ENTITY, "Password is too weak"));
  if (Model.existsUsername(username)) return next(createError(StatusCodes.CONFLICT, "Username already exists"));

  // Create new user
  const user: User = new UserBuilder()
    .addUsername(username)
    .addFirstName(firstName)
    .addLastName(lastName)
    .addEmail(email)
    .addPassword(password)
    .build();

  Model.users.push(user);
  res.status(StatusCodes.CREATED).send({ id: user.uuid });
};

export const update_user = (req, res, next) => {
  // TODO very inefficient. Use repository
  const { username, firstName, lastName, email, password } = req.body;

  const user: User = new User(req.uuid);
  const bUsername = user.username;
  const bFirstName = user.firstName;
  const bLastName = user.lastName;
  const bEmail = user.email;
  const bPasswordHash = user.passwordHash;

  try {
    if (username) user.username = username;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (password) user.password = password;

    res.sendStatus(StatusCodes.OK);
  } catch (error) {
    // Restore
    try {
      user.username = bUsername;
      user.firstName = bFirstName;
      user.lastName = bLastName;
      user.email = bEmail;
      user.passwordHash = bPasswordHash;

      createError(StatusCodes.BAD_REQUEST, error.message);
    } catch (error2) {
      createError(StatusCodes.INTERNAL_SERVER_ERROR,
        "Could not restore state.\nFirst error: " + error.message + "\nSecond error: " + error2.message);
    }
  }
};

export const get_display_name = (req, res, next) => {
  // @ts-ignore TODO
  res.send({ displayName: Model.getUserFromUsername(req.accessTokenContent.username)?.displayName }); // TODO null coalescing
};
