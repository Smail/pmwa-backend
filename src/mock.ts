import * as Model from './model';
import { User, UserBuilder } from './User';
import { faker } from "@faker-js/faker/locale/en_US";
import { Task, TaskBuilder } from "./Task";

const debug = require('debug')('backend:mock');
// Load config
require('dotenv').config();

// Add faker.js data if in debug mode
if (process.env.DEBUG) {
  const usersTmp: User[] = [];
  (async () => {
    const { faker } = require('@faker-js/faker/locale/en_US');

    faker.seed(123);

    for (let i = 0; i < 20; i++) {
      const randomName = faker.name.findName(); // Jane Doe
      const firstName = randomName.split(' ')[0]; // Jane
      const lastName = randomName.split(' ')[1]; // Doe
      const username = faker.internet.userName(firstName, lastName);

      const user: User = new UserBuilder()
        .addUsername(username)
        .addFirstName(firstName)
        .addLastName(lastName)
        .addEmail(faker.internet.email())
        .addPassword(faker.internet.password(15))
        .build();
      usersTmp.push(user);
    }

    const smail: User = new UserBuilder()
      .addUsername('smail')
      .addDisplayName('Smail')
      .addFirstName('Smail')
      .addLastName('Mustermann')
      .addEmail('smail@example.com')
      .addPassword('Smail1234')
      .build();
    debug(`UUID: ${smail.uuid}`);
    debug(`Username: ${smail.username}`);
    debug(`Display name: ${smail.displayName}`);
    debug(`First name: ${smail.firstName}`);
    debug(`Last name: ${smail.lastName}`);
    usersTmp.push(smail);

    // Create fake tasks for smail
    for (let i = 0; i < 10; i++) {
      const smailTask: Task = new TaskBuilder()
        .addUserUuid(smail.uuid)
        .addName(faker.hacker.phrase())
        .addContent(faker.hacker.phrase())
        .build();
      debug(`Task created: ${JSON.stringify(smailTask)}`)
    }

    // Add created mock elements to users array
    for (const user of usersTmp) {
      const username = user.username.toLowerCase();

      // Only add unique usernames
      if (Model.users.find(u => u.username.toLowerCase() === username) == null) {
        Model.users.push(user);
      }
    }
  })();
}
