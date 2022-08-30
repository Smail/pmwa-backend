CREATE TABLE IF NOT EXISTS refreshTokens (
  uuid        TEXT PRIMARY KEY NOT NULL,
  tokenCipher TEXT UNIQUE      NOT NULL,
  userUuid    TEXT             NOT NULL,
  created_at  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userUuid) REFERENCES users (uuid)
);

-- CREATE TRIGGER forbidRefreshTokenUpdate UPDATE ON refreshTokens
-- BEGIN
--   IF UPDATE(name)
-- BEGIN
-- ROLLBACK
--   RAISERROR('Changes column name not allowed', 16, 1);
-- END
--   ELSE
-- BEGIN
-- --possible update that doesn't change the groupname
-- END
-- END
