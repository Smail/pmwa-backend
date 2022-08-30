import express from 'express';
import { requireAccessToken } from '@middleware/auth';
import { checkUsername } from "@middleware/checkUsername";
import { create_user, get_display_name, get_user } from "@controllers/usersController";
import { requireUuid } from "@middleware/requireUuid";

const router = express.Router();

/* GET user */
router.get('/:uuid', requireAccessToken, requireUuid, get_user);

/* CREATE user */
router.post('/', create_user);

router.get('/:username/display-name', requireAccessToken, checkUsername, get_display_name);

export { router };
