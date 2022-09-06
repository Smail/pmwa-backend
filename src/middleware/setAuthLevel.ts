export const AUTH_LEVEL_PUBLIC = "public";
export const AUTH_LEVEL_PRIVATE = "private";

export function setAuthLevel(req, res, next) {
  const authHeader = req.headers.authorization;
  req.authLevel = (authHeader == null ? AUTH_LEVEL_PUBLIC : AUTH_LEVEL_PRIVATE);

  next();
}
