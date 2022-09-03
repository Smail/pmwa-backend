import express from "express";
import { requireAccessToken } from "@middleware/requireAccessToken";
import { get_user, update_user } from "@controllers/users.controller";
import { requireUuid } from "@middleware/requireUuid";

const router = express.Router();

/* GET user */
router.get("/:uuid", requireAccessToken, requireUuid, get_user);

/* UPDATE user */
router.patch("/", requireAccessToken, requireUuid, update_user);

export { router };
