import express from "express";
import { router as tagsRouter } from "@routes/tags";
import { requireTaskUuid } from "@middleware/requireTaskUuid";
import { requireTaskName } from "@middleware/requireTaskName";
import { loadAuthenticatedUser, requireAccessToken } from "@middleware/auth";
import { create_task, delete_task, get_tasks, update_task } from "@controllers/taskController";

const router = express.Router();

router.use(requireAccessToken);
router.use(loadAuthenticatedUser);
router.use("/tags", tagsRouter);

/* GET user's tasks. */
router.get("/", get_tasks);

/* POST Create new user task. */
router.post("/create", requireTaskName, create_task);

/* Update user task. */
router.post("/update", requireTaskUuid, update_task);

/* DELETE user task. */
router.delete("/:uuid", delete_task);

export { router };
