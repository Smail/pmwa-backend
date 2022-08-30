import * as Model from "../Model";

export const get_user = (req, res, next) => {
  // @ts-ignore TODO
  res.send(Model.getUserFromUuid(req.body.uuid)?.toString()); // TODO this is weird code? toString doesnt exists TODO (...)?.username
}

export const get_display_name = (req, res, next) => {
  // @ts-ignore TODO
  res.send({ displayName: Model.getUserFromUsername(req.accessTokenContent.username)?.displayName }); // TODO null coalescing
}
