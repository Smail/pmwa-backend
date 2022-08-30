import express from 'express';
import { requireAccessToken } from '@middleware/auth';
import { create_user, get_user, update_user } from "@controllers/usersController";
import { requireUuid } from "@middleware/requireUuid";

const router = express.Router();

/* GET user */
router.get('/:uuid', requireAccessToken, requireUuid, get_user);

/* CREATE user */
router.post('/', create_user);

/* UPDATE user */
router.patch('/', requireAccessToken, requireUuid, update_user);

export { router };
