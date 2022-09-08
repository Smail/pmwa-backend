import Debug from "debug";
import { Model } from "./Model";
import { faker } from "@faker-js/faker/locale/en_US";
import { User } from "@models/User";
import { Task } from "@models/Task";
import { Tag } from "@models/Tag";
import fs from "fs";

if (process.env.DEBUG) {
  const debug = Debug("backend:mock");

  if (!process.env.DB_PATH) throw new Error("Missing environment variable DB_PATH");
  const dbPath: string = process.env.DB_PATH;

  function removeDebugDatabase() {
    if (process.env.DEBUG) {
      // If memory then database sits in memory (RAM) and not on disk (file)
      if (dbPath !== ":memory:") {
        debug("Removing old database if it exists");
        fs.unlink(dbPath, (err) => {
          if (err) debug(err);
        });
      }
    }
  }

  process.on("exit", removeDebugDatabase);

  // Add faker.js data if in debug mode
  const usersTmp: User[] = [];
  (async () => {
    const { faker } = require("@faker-js/faker/locale/en_US");

    for (let i = 0; i < 3; i++) {
      const user = new User();
      user.assignUniqueId();
      user.firstName = faker.name.firstName(); // Jane
      user.lastName = faker.name.lastName(); // Doe
      user.username = faker.internet.userName(user.firstName, user.lastName);
      user.email = faker.internet.email();
      user.password = faker.internet.password(15);

      usersTmp.push(user);
    }

    const smail = new User();
    smail.assignUniqueId();
    smail.username = "smail";
    smail.email = "smail@example.com";
    smail.password = "Smail1234";
    smail.displayName = "Smail";
    smail.firstName = "Smail";
    smail.lastName = "Doe";
    usersTmp.push(smail);

    // Add created mock elements to users array
    for (const user of usersTmp) {
      // Only add unique usernames
      Model.userRepository.create(user);
      debug("User created: " + JSON.stringify(user));
    }

    // Create fake tasks for smail
    const tags = [faker.word.noun(), faker.word.noun(), faker.word.noun()];
    for (let i = 0; i < 10; i++) {
      const task = new Task();

      task.name = faker.hacker.phrase();
      task.content = faker.hacker.phrase();
      debug("Task created: " + JSON.stringify(task));

      // Create fake tags for the just now created task
      for (let j = 0; j < Math.round(5 * Math.random()); j++) {
        const tag = new Tag();
        tag.assignUniqueId();
        tag.name = tags[Math.floor(tags.length * Math.random())];
        tag.color = (Math.random() < 0.8) ? faker.internet.color() : null;
        debug("Tag created: " + JSON.stringify(tag));
      }
    }
  })();
}
