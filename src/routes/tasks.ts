import express from "express";
import { router as tagsRouter } from "@routes/tags";
import { requireUuid } from "@middleware/requireUuid";
import { requireTaskName } from "@middleware/requireTaskName";
import { loadAuthenticatedUser } from "@middleware/auth";
import { requireAccessToken } from "@middleware/requireAccessToken";
import { create_task, delete_task, get_tasks, update_task } from "@controllers/task.controller";

const router = express.Router();

router.use(requireAccessToken);
router.use(loadAuthenticatedUser);
router.use("/tags", tagsRouter);

/* GET user's tasks. */
router.get("/", get_tasks);

/* POST Create new user task. */
router.post("/create", requireTaskName, create_task);

/* Update user task. */
router.post("/update", requireUuid, update_task);

/* DELETE user task. */
router.delete("/:uuid", delete_task);

export { router };
