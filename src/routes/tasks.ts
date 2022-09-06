import express from "express";
import { router as tagsRouter } from "@routes/tags";
import { requireUuidInBody } from "@middleware/requireUuidInBody";
import { requireTaskName } from "@middleware/requireTaskName";
import { requireAccessToken } from "@middleware/requireAccessToken";
import { requireAuthenticatedUser } from "@middleware/requireAuthenticatedUser";
import { create_task, delete_task, get_tasks, update_task } from "@controllers/task.controller";

const router = express.Router();

router.use(requireAccessToken);
router.use(requireAuthenticatedUser);

/* GET user's tasks. */
router.get("/", get_tasks);

/* POST Create new user task. */
router.post("/", requireTaskName, create_task);

/* Update user task. */
router.patch("/", requireUuidInBody, update_task);

/* DELETE user task. */
router.delete("/", requireUuidInBody, delete_task);

export { router };
