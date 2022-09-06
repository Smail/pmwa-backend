import express from "express";
import { requireAccessToken } from "@middleware/requireAccessToken";
import { requireAuthenticatedUser } from "@middleware/requireAuthenticatedUser";
import { create_task, delete_task, get_task, get_tasks, update_task } from "@controllers/task.controller";
import { router as tagsRouter } from "@routes/tags";

const router = express.Router();

router.use(requireAccessToken);
router.use(requireAuthenticatedUser);

/* GET user tasks. */
router.get("/", get_tasks);

/* GET user task. */
router.get("/:taskId", get_task);

/* POST Create new user task. */
router.post("/", create_task);

/* PATCH Update user task. */
router.patch("/:taskId", update_task);

/* DELETE user task. */
router.delete("/:taskId", delete_task);

export { router };
