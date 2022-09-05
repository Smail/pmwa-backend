import express from "express";
import { requireAccessToken } from "@middleware/requireAccessToken";
import { requireAuthenticatedUser } from "@middleware/requireAuthenticatedUser";
import { get_tag, get_tags } from "@controllers/tags.controller";
import { requireUuid } from "@middleware/requireUuid";

const router = express.Router({ mergeParams: true });

router.use(requireAccessToken);
router.use(requireAuthenticatedUser);

/* GET all available tags. */
router.get("/", get_tags);

/* GET tag. */
router.get("/", requireUuid, get_tag);

export { router };
