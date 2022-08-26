const { assert } = require('console');
import { User } from './User';

import * as Database from './database';

// Create tables
Database.db.prepare(Database.queries['createTableUsers']).run();
Database.db.prepare(Database.queries['createTableRefreshTokens']).run();
Database.db.prepare(Database.queries['createTableTasks']).run();

const users: User[] = [];
// Observe push method on users array.
// Automatically serialize users array.
users.push = function () {
  // Check if the elements pushed are of type User.
  for (const key in arguments) {
    const value = arguments[key];

    if (!(value instanceof User)) {
      throw new Error('Element pushed into users array is not of Type User. ' + JSON.stringify(value));
    }

    if (users.filter(user => user.username.toLowerCase() === value.username.toLowerCase()).length > 0) {
      throw new Error('Username already exists');
    }
  }

  return Array.prototype.push.apply(this, arguments);
};

function getUserFromUsername(username: string): User | undefined {
  assert(username, new Error('Username is null'));
  return users.find(user => user.username.toLowerCase() === username.toLowerCase());
}

function existsUsername(username: string): boolean {
  assert(username, new Error('Username is null'));
  return getUserFromUsername(username) != null;
}

export { users,getUserFromUsername,existsUsername };
