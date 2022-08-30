import { UserDepreciated } from "@models/User.depreciated";
import * as Database from "./Database";

// Create all tables
for (const queryName in Database.queries) {
  if (queryName.toLowerCase().startsWith("createTable".toLowerCase())) {
    if (!queryName.startsWith("createTable")) {
      console.warn(`File ${queryName} doesn't match camelCase naming convention.`);
    }
    Database.db.prepare(Database.queries[queryName]).run();
  }
}

const users: UserDepreciated[] = [];
// Observe push method on users array.
// Automatically serialize users array.
users.push = function () {
  // Check if the elements pushed are of type User.
  for (const key in arguments) {
    const value = arguments[key];

    if (!(value instanceof UserDepreciated)) {
      throw new Error("Element pushed into users array is not of Type User. " + JSON.stringify(value));
    }

    if (users.filter(user => user.username.toLowerCase() === value.username.toLowerCase()).length > 0) {
      throw new Error("Username already exists");
    }
  }

  return Array.prototype.push.apply(this, arguments);
};

function getUserFromUsername(username: string | null): UserDepreciated | undefined {
  if (!username) return undefined;
  return users.find(user => user.username.toLowerCase() === username.toLowerCase());
}

export function getUserFromUuid(uuid: string | null): UserDepreciated | undefined {
  if (!uuid) return undefined;
  return users.find(user => user.uuid === uuid);
}

function existsUsername(username: string | null): boolean {
  if (!username) return false;
  return getUserFromUsername(username) != null;
}

export { users, getUserFromUsername, existsUsername };
