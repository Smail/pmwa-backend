CREATE TABLE IF NOT EXISTS users
(
    uuid         TEXT PRIMARY KEY,
    username     TEXT UNIQUE NOT NULL,
    displayName  TEXT,
    firstName    TEXT        NOT NULL,
    lastName     TEXT        NOT NULL,
    email        TEXT UNIQUE NOT NULL,
    passwordHash TEXT        NOT NULL,
    created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
)

-- constraint lowercase username