CREATE TABLE IF NOT EXISTS refreshTokens (
    uuid        TEXT PRIMARY KEY NOT NULL,
    tokenCipher TEXT UNIQUE      NOT NULL,
    userUuid    TEXT             NOT NULL,
    created_at  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userUuid) REFERENCES users (uuid)
)