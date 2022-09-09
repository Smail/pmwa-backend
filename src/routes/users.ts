import express from "express";
import { requireAccessToken } from "@middleware/requireAccessToken";
import { get_users, get_user, update_user } from "@controllers/users.controller";
import { setAuthLevel } from "@middleware/setAuthLevel";
import { requireAuthenticatedUser } from "@middleware/requireAuthenticatedUser";
import { requireAuthLevelPrivate } from "@middleware/requireAuthLevelPrivate";
import { requireAuthLevelPublic } from "@middleware/requireAuthLevelPublic";

const router = express.Router();

/* GET users */
router.get("/", setAuthLevel, requireAuthLevelPublic, get_users);

/* GET user. Depending on if an access token is provided or not this returns public or private information */
router.get("/:username", setAuthLevel, get_user);

/* UPDATE user */
router.patch("/:username", setAuthLevel, requireAuthLevelPrivate, requireAccessToken,  requireAuthenticatedUser,
  update_user);

export { router };
